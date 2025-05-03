import { REST, zquery } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = REST(async ({ params, rest }) => {
	const partialSound = rest.parseQueryParameters({
		name: zquery.string().optional(),
		keywords: zquery.string().optional()
	});

	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);
	const updatedSound = await guildState.data.patchSound(params.soundId, partialSound);

	return json(updatedSound);
});
