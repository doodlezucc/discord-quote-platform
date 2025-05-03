export interface DiscordGuildMemberSnippet {
	id: string;
	displayName: string;
	avatarUrl: string;
}

export interface GuildDataSoundSnippet {
	id: string;
	name: string;
	keywords: string;
	mediaPath: string;
	createdBy: string;
}

export type GuildDataSoundPatch = Partial<Pick<GuildDataSoundSnippet, 'name' | 'keywords'>>;

export interface GuildDataSnippet {
	sounds: GuildDataSoundSnippet[];
}

export interface UserGuildSnippet {
	id: string;
	name: string;
	iconId: string | null;
	guildData?: GuildDataSnippet;
}
