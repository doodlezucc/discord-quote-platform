import { REST, zquery } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = REST(async ({ params, rest }) => {
	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);

	const { name: commandName } = rest.parseQueryParameters({
		name: zquery.string().optional()
	});

	const createdSound = await guildState.data.createCommand({
		name: commandName ?? 'new-command'
	});

	return json(createdSound);
});
