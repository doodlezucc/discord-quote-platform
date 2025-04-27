import type { UserGuildSnippet } from '$lib/snippets';
import {
	PermissionFlagsBits,
	Routes,
	type REST,
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
		const guildState = bot.guildStates.get(guild.id);
		if (guildState) {
			const sounds = await db
				.select()
				.from(table.sound)
				.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id))
				.where(eq(table.sound.guildId, guild.id));

			results.push({
				id: guild.id,
				name: guild.name,
				iconId: guild.icon,
				guildData: {
					sounds: sounds.map(({ sound, asset }) => ({
						name: sound.name,
						keywords: sound.keywords,
						mediaPath: server.assetManager.resolveAssetPath(asset!.path)
					}))
				}
			});
		} else if (hasManageServerPermissions(guild)) {
			results.push({
				id: guild.id,
				name: guild.name,
				iconId: guild.icon
			});
		}
	}

	return results;
}

interface RESTResultWithPermissions {
	permissions: string;
}

function hasManageServerPermissions({ permissions }: RESTResultWithPermissions) {
	const permissionFlags = BigInt(permissions);

	return (permissionFlags & PermissionFlagsBits.ManageGuild) > 0;
}
