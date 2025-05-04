import { REST, zquery } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = REST(async ({ params, rest }) => {
	const patch = rest.parseQueryParameters({
		name: zquery.string().optional()
	});

	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);
	const updatedCommand = await guildState.data.patchCommand({
		id: params.commandId,
		patch
	});

	return json(updatedCommand);
});

export const DELETE: RequestHandler = REST(async ({ params, rest }) => {
	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);
	await guildState.data.deleteCommand({ id: params.commandId });

	return new Response();
});
