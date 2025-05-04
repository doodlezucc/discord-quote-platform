import type { DiscordGuildMemberSnippet, UserGuildSnippet } from '$lib/snippets';
import {
	PermissionFlagsBits,
	Routes,
	type REST,
	type RESTAPIPartialCurrentUserGuild,
	type RESTGetAPICurrentUserGuildsResult
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { server } from '..';
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
			.select()
			.from(table.command)
			.where(eq(table.command.guildId, guild.id));

		const entries = await db
			.select({ sound: table.sound, asset: table.asset })
			.from(table.sound)
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id))
			.leftJoin(table.command, eq(table.sound.commandId, table.command.id))
			.where(eq(table.command.guildId, guild.id));

		const relevantUserIds = new Set(entries.map((entry) => entry.asset!.createdBy));
		const discordGuild = await (await bot).client.guilds.fetch(guild.id);

		const memberSnippets = await Promise.all(
			relevantUserIds.values().map(async (userId): Promise<DiscordGuildMemberSnippet> => {
				const guildMember = await discordGuild.members.fetch(userId);

				return {
					id: userId,
					displayName: guildMember.displayName,
					avatarUrl: guildMember.displayAvatarURL()
				};
			})
		);

		return {
			id: guild.id,
			name: guild.name,
			iconId: guild.icon,
			guildData: {
				commands: commands.map((command) => ({
					id: command.id,
					name: command.name,
					sounds: entries
						.filter(({ sound }) => sound.commandId === command.id)
						.map(({ sound, asset }) => ({
							id: sound.id,
							name: sound.name,
							keywords: sound.keywords,
							mediaPath: server.assetManager.resolveAssetPath(asset!.path),
							createdBy: asset!.createdBy
						}))
				})),
				members: memberSnippets
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
