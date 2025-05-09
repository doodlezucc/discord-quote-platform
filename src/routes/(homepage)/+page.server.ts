import { base } from '$app/paths';
import { actionLogout } from '$lib/server/auth';
import { OAuth2API } from '@discordjs/core';
import { redirect, type Actions } from '@sveltejs/kit';
import { REST } from 'discord.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (!session) {
		return redirect(303, `${base}/login`);
	}

	const discordRest = new REST({ authPrefix: 'Bearer' }).setToken(session.accessToken);
	const discordOAuth2Api = new OAuth2API(discordRest);

	const { user } = await discordOAuth2Api.getCurrentAuthorizationInformation();

	return {
		username: user!.username
	};
};

export const actions: Actions = {
	logout: actionLogout
};
