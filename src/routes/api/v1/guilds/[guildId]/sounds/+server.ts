import { authorized } from '$lib/server/rest/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = authorized(async ({ params, request, url, auth }) => {
	const { userId } = auth.requireSession();
	await auth.requireMemberOfGuild(params.guildId);

	const guildState = await auth.requireGuildState(params.guildId);

	const soundName = url.searchParams.get('name');
	const createdSound = await guildState.data.createSound({
		name: soundName ?? 'New Sound',
		userId: userId,
		request: request
	});

	return json(createdSound);
});
