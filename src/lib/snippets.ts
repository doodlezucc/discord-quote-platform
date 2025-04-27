export interface GuildDataSoundSnippet {
	name: string;
	keywords: string;
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
