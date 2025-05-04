export interface DiscordGuildMemberSnippet {
	id: string;
	displayName: string;
	avatarUrl: string;
}

export interface GuildDataCommandSnippet {
	id: string;
	name: string;
}

export interface GuildDataCommandSnippetPopulated extends GuildDataCommandSnippet {
	sounds: GuildDataSoundSnippet[];
}

export type GuildDataCommandPatch = Partial<Pick<GuildDataSoundSnippet, 'name'>>;

export interface GuildDataSoundSnippet {
	id: string;
	name: string;
	keywords: string;
	mediaPath: string;
	createdBy: string;
}

export type GuildDataSoundPatch = Partial<Pick<GuildDataSoundSnippet, 'name' | 'keywords'>>;

export interface GuildDataSnippet {
	commands: GuildDataCommandSnippetPopulated[];
	members: DiscordGuildMemberSnippet[];
}

export interface UserGuildSnippet {
	id: string;
	name: string;
	iconId: string | null;
	guildData?: GuildDataSnippet;
}
