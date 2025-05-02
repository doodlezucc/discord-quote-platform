import { REST, zquery } from '$lib/server/rest';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = REST(async ({ params, request, rest }) => {
	const { userId } = rest.requireSession();
	await rest.requireMemberOfGuild(params.guildId);

	const guildState = await rest.requireGuildState(params.guildId);

	const { name: soundName } = rest.parseQueryParameters({
		name: zquery.string().optional()
	});

	const createdSound = await guildState.data.createSound({
		name: soundName ?? 'New Sound',
		userId: userId,
		request: request
	});

	return json(createdSound);
});
