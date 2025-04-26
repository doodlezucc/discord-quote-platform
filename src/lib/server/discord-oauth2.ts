import { DISCORD_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';
import { OAuth2API, type RESTPostOAuth2AccessTokenResult } from '@discordjs/core';
import { REST } from 'discord.js';
import type { Session } from './db/schema';

const SCOPES = ['identify', 'guilds'];

export function generateOAuth2GrantUrl(redirectUri: string) {
	const discordOAuth2Api = new OAuth2API(new REST());

	return discordOAuth2Api.generateAuthorizationURL({
		client_id: PUBLIC_DISCORD_CLIENT_ID,
		response_type: 'code',
		scope: SCOPES.join(' '),
		redirect_uri: redirectUri
	});
}

export type OAuth2Session = Pick<Session, 'accessToken' | 'refreshToken' | 'expiresAt'>;

function convertResultToSession(result: RESTPostOAuth2AccessTokenResult): OAuth2Session {
	return {
		accessToken: result.access_token,
		refreshToken: result.refresh_token,
		expiresAt: new Date(Date.now() + result.expires_in * 1000)
	};
}

export async function exchangeDiscordAccessToken(code: string, redirectUri: string) {
	const discordOAuth2Api = new OAuth2API(new REST());

	const result = await discordOAuth2Api.tokenExchange({
		client_id: PUBLIC_DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: redirectUri
	});

	return convertResultToSession(result);
}

export async function refreshDiscordAccessToken(refreshToken: string) {
	const discordOAuth2Api = new OAuth2API(new REST());

	const result = await discordOAuth2Api.refreshToken({
		client_id: PUBLIC_DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	});

	return convertResultToSession(result);
}

export async function revokeDiscordAccessToken(accessToken: string) {
	const discordOAuth2Api = new OAuth2API(new REST());

	await discordOAuth2Api.revokeToken(PUBLIC_DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, {
		token_type_hint: 'access_token',
		token: accessToken
	});
}
