import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { url } = event;

	const accessCode = url.searchParams.get('code');

	if (!accessCode) {
		return error(400, { message: 'Missing "code" parameter in URL' });
	}

	const redirectUri = `${url.protocol}//${url.host}${url.pathname}`;

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, accessCode, redirectUri);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return redirect(303, '/');
};
