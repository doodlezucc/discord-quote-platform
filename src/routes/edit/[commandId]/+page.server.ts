import { base } from '$app/paths';
import { actionLogout } from '$lib/server/auth';
import { bot } from '$lib/server/bot';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { fetchSoundSnippets } from '$lib/server/queries/fetch-command-sounds';
import type { DiscordGuildMemberSnippet } from '$lib/snippets';
import type { Actions } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type { GuildMember } from 'discord.js';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session }, params }) => {
	if (!session) {
		// TODO: add a query parameter to redirect to this exact page when logged in
		return redirect(303, `${base}/login`);
	}

	const [command = undefined] = await db
		.select()
		.from(table.command)
		.where(eq(table.command.id, params.commandId));

	if (!command) {
		throw error(404, { message: 'Command not found' });
	}

	const guild = await (await bot).client.guilds.fetch(command.guildId);
	let guildMember: GuildMember;

	try {
		guildMember = await guild.members.fetch(session.userId);
	} catch {
		throw error(403, { message: 'No access' });
	}

	const soundSnippets = await fetchSoundSnippets(guild.id, command.id);

	return {
		username: guildMember.user.username,
		member: {
			id: guildMember.user.id,
			displayName: guildMember.displayName,
			avatarUrl: guildMember.displayAvatarURL()
		} as DiscordGuildMemberSnippet,
		command: {
			id: command.id,
			name: command.name,
			guildId: command.guildId,
			guildName: guild.name
		},
		sounds: soundSnippets
	};
};

export const actions: Actions = {
	logout: actionLogout
};
