import * as auth from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.session = null;
		return resolve(event);
	}

	try {
		const session = await auth.validateSessionToken(sessionToken);

		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		event.locals.session = session;
	} catch (err) {
		console.log('Error validating session token', err);
		auth.deleteSessionTokenCookie(event);
	}

	return resolve(event);
};

export const handle: Handle = handleAuth;
