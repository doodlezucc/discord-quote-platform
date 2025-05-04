import { fetchUserGuildStates } from '$lib/server/queries/user-guilds';
import { REST } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import { REST as DiscordRest } from 'discord.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = REST(async ({ rest }) => {
	const { accessToken } = rest.requireSession();

	const discordRest = new DiscordRest({ authPrefix: 'Bearer' }).setToken(accessToken);
	const guilds = await fetchUserGuildStates(discordRest);

	return json(guilds);
});
