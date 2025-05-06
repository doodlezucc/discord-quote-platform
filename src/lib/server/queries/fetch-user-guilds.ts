import type { UserGuildSnippet } from '$lib/snippets';
import {
	PermissionFlagsBits,
	Routes,
	type REST,
	type RESTAPIPartialCurrentUserGuild,
	type RESTGetAPICurrentUserGuildsResult
} from 'discord.js';
import { count, eq } from 'drizzle-orm';
import { bot } from '../bot';
import { db } from '../db';
import * as table from '../db/schema';

export async function fetchUserGuildStates(rest: REST): Promise<UserGuildSnippet[]> {
	const userGuilds = (await rest.get(Routes.userGuilds())) as RESTGetAPICurrentUserGuildsResult;

	const results: UserGuildSnippet[] = [];

	for (const guild of userGuilds) {
		const guildSnippet = await convertGuildToSnippet(guild);
		if (guildSnippet) {
			results.push(guildSnippet);
		}
	}

	return results;
}

interface RESTResultWithPermissions {
	permissions: string;
}

async function convertGuildToSnippet(
	guild: RESTAPIPartialCurrentUserGuild
): Promise<UserGuildSnippet | null> {
	const guildState = (await bot).guildStates.get(guild.id);

	if (guildState) {
		const commands = await db
			.select({ command: table.command, soundCount: count(table.sound.id) })
			.from(table.command)
			.where(eq(table.command.guildId, guild.id))
			.leftJoin(table.sound, eq(table.sound.commandId, table.command.id))
			.groupBy(table.command.id);

		return {
			id: guild.id,
			name: guild.name,
			iconId: guild.icon,
			guildData: {
				commands: commands.map(({ command, soundCount }) => ({
					id: command.id,
					name: command.name,
					soundCount: soundCount
				}))
			}
		};
	} else if (hasManageServerPermissions(guild)) {
		return {
			id: guild.id,
			name: guild.name,
			iconId: guild.icon
		};
	}

	return null;
}

function hasManageServerPermissions({ permissions }: RESTResultWithPermissions) {
	const permissionFlags = BigInt(permissions);

	return (permissionFlags & PermissionFlagsBits.ManageGuild) > 0;
}
