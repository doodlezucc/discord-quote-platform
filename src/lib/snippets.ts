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

export interface GuildDataCommandSnippetWithSoundCount extends GuildDataCommandSnippet {
	soundCount: number;
}

export type GuildDataCommandPatch = Partial<Pick<GuildDataSoundSnippet, 'name'>>;

export interface GuildDataSoundSnippet {
	id: string;
	name: string;
	keywords: string;
	mediaPath: string;
	createdBy: string;
}

export interface GuildDataSoundSnippetWithOwner {
	id: string;
	name: string;
	keywords: string;
	mediaPath: string;
	createdBy: DiscordGuildMemberSnippet;
}

export type GuildDataSoundPatch = Partial<Pick<GuildDataSoundSnippet, 'name' | 'keywords'>>;

export interface GuildDataSnippet {
	commands: GuildDataCommandSnippetWithSoundCount[];
}

export interface UserGuildSnippet {
	id: string;
	name: string;
	iconId: string | null;
	guildData?: GuildDataSnippet;
}

export interface CommandPageSnippet {
	members: DiscordGuildMemberSnippet[];
}
