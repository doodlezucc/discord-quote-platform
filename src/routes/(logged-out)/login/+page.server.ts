import { base } from '$app/paths';
import { generateOAuth2GrantUrl } from '$lib/server/discord-oauth2';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session) {
		return redirect(303, `${base}/`);
	}
	return {};
};

export const actions = {
	login: async ({ url }) => {
		const successUri = `${url.protocol}//${url.host}${base}/login-success`;
		const authorizationUrl = generateOAuth2GrantUrl(successUri);

		return redirect(303, authorizationUrl);
	}
} satisfies Actions;
