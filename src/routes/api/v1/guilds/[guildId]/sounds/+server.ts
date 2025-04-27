import { bot } from '$lib/server/bot';
import { error, json } from '@sveltejs/kit';
import { REST, Routes, type RESTGetAPICurrentUserGuildsResult } from 'discord.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const userAccessToken = locals.session?.accessToken;
	const userId = locals.session?.userId;

	if (!userAccessToken || !userId) {
		return error(401, { message: 'Unable to infer Discord user access' });
	}

	// Verify that the user is part of the specified guild
	const rest = new REST({ authPrefix: 'Bearer' }).setToken(userAccessToken);
	const userGuilds = (await rest.get(Routes.userGuilds())) as RESTGetAPICurrentUserGuildsResult;

	const guildUser = userGuilds.find((guild) => guild.id === params.guildId);

	if (!guildUser) {
		return error(401, { message: 'Missing permissions in guild' });
	}

	const createdSound = await bot.guildStates.get(params.guildId)!.data.createSound(userId, request);

	return json(createdSound);
};
