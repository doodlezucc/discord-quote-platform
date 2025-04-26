import * as auth from '$lib/server/auth';
import { revokeDiscordAccessToken } from '$lib/server/discord-oauth2';
import { OAuth2API, Routes, type RESTGetAPICurrentUserGuildsResult } from '@discordjs/core';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { REST } from 'discord.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) {
		return redirect(303, '/login');
	}

	const discordRest = new REST({ authPrefix: 'Bearer' }).setToken(event.locals.session.accessToken);
	const discordOAuth2Api = new OAuth2API(discordRest);

	const { user } = await discordOAuth2Api.getCurrentAuthorizationInformation();
	const guilds = (await discordRest.get(Routes.userGuilds())) as RESTGetAPICurrentUserGuildsResult;

	return {
		user: user!,
		guilds: guilds
	};
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		await revokeDiscordAccessToken(event.locals.session.accessToken);
		auth.deleteSessionTokenCookie(event);

		return redirect(303, '/login');
	}
};
