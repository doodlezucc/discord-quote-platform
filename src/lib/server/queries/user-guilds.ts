import {
	PermissionFlagsBits,
	Routes,
	type REST,
	type RESTGetAPICurrentUserGuildsResult
} from 'discord.js';
import { bot } from '../bot';

export interface GuildDataSoundSnippet {
	mediaPath: string;
}

export interface GuildDataSnippet {
	sounds: GuildDataSoundSnippet[];
}

export interface UserGuildSnippet {
	id: string;
	name: string;
	iconId: string | null;
	guildData?: GuildDataSnippet;
}

export async function fetchUserGuildStates(rest: REST): Promise<UserGuildSnippet[]> {
	const userGuilds = (await rest.get(Routes.userGuilds())) as RESTGetAPICurrentUserGuildsResult;

	const results: UserGuildSnippet[] = [];

	for (const guild of userGuilds) {
		const guildState = bot.guildStates.get(guild.id);
		if (guildState) {
			results.push({
				id: guild.id,
				name: guild.name,
				iconId: guild.icon,
				guildData: {
					sounds: []
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
