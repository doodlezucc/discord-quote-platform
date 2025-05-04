import { REST, zquery } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = REST(async ({ params, rest }) => {
	const { userId } = rest.requireSession();
	const patch = rest.parseQueryParameters({
		name: zquery.string().optional(),
		keywords: zquery.string().optional()
	});

	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);
	const updatedSound = await guildState.data.patchSound({
		userId,
		commandId: params.commandId,
		id: params.soundId,
		patch
	});

	return json(updatedSound);
});

export const DELETE: RequestHandler = REST(async ({ params, rest }) => {
	const { userId } = rest.requireSession();
	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);
	await guildState.data.deleteSound({ userId, commandId: params.commandId, id: params.soundId });

	return new Response();
});
