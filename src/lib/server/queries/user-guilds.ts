import type { UserGuildSnippet } from '$lib/snippets';
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
		const sounds = await db
			.select()
			.from(table.sound)
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id))
			.where(eq(table.sound.guildId, guild.id));

		return {
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
