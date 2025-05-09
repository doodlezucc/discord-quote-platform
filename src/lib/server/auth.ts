import { base } from '$app/paths';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { OAuth2API } from '@discordjs/core';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { REST } from 'discord.js';
import { eq } from 'drizzle-orm';
import {
	exchangeDiscordAccessToken,
	refreshDiscordAccessToken,
	revokeDiscordAccessToken
} from './discord-oauth2';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export type Session = table.Session;

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

function encryptSessionToken(token: string) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(sessionToken: string, oauth2Code: string, redirectUri: string) {
	const oauth2Session = await exchangeDiscordAccessToken(oauth2Code, redirectUri);

	const discordRest = new REST({ authPrefix: 'Bearer' }).setToken(oauth2Session.accessToken);
	const discordOAuth2Api = new OAuth2API(discordRest);
	const { user } = await discordOAuth2Api.getCurrentAuthorizationInformation();

	if (!user) {
		throw new Error('Exchanged access token for session has no Discord user attached');
	}

	const session: table.Session = {
		id: encryptSessionToken(sessionToken),
		userId: user.id,
		...oauth2Session
	};

	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string): Promise<Session> {
	const sessionId = encryptSessionToken(token);
	const [session] = await db.select().from(table.session).where(eq(table.session.id, sessionId));

	if (!session) {
		throw new Error('Invalid session token');
	}

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		throw new Error('Session has already expired');
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 5;
	if (renewSession) {
		console.log('Renewing...');
		const oauth2Session = await refreshDiscordAccessToken(session.refreshToken);

		await db
			.update(table.session)
			.set({ ...oauth2Session })
			.where(eq(table.session.id, session.id));

		return {
			...session,
			...oauth2Session
		};
	}

	return session;
}

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: `${base}/`
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: `${base}/`
	});
}

export async function actionLogout(event: RequestEvent) {
	if (!event.locals.session) {
		return fail(401);
	}

	await invalidateSession(event.locals.session.id);
	await revokeDiscordAccessToken(event.locals.session.accessToken);
	deleteSessionTokenCookie(event);

	return redirect(303, `${base}/login`);
}
