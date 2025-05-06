import type { DiscordGuildMemberSnippet, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
import { eq } from 'drizzle-orm';
import { server } from '..';
import { bot } from '../bot';
import { db } from '../db';
import * as table from '../db/schema';

export async function fetchSoundSnippets(guildId: string, commandId: string) {
	const entries = await db
		.select({ sound: table.sound, assetPath: table.asset.path, createdBy: table.asset.createdBy })
		.from(table.sound)
		.where(eq(table.sound.commandId, commandId))
		.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

	const relevantUserIds = new Set(entries.map((entry) => entry.createdBy!));
	const discordGuild = await (await bot).client.guilds.fetch(guildId);

	const memberSnippets: Record<string, DiscordGuildMemberSnippet> = {};

	await Promise.all(
		relevantUserIds.values().map(async (userId) => {
			const guildMember = await discordGuild.members.fetch(userId);

			memberSnippets[userId] = {
				id: userId,
				displayName: guildMember.displayName,
				avatarUrl: guildMember.displayAvatarURL()
			};
		})
	);

	return entries.map<GuildDataSoundSnippetWithOwner>(({ sound, assetPath, createdBy }) => ({
		id: sound.id,
		name: sound.name,
		keywords: sound.keywords,
		mediaPath: server.assetManager.resolveAssetPath(assetPath!),
		createdBy: memberSnippets[createdBy!]
	}));
}
