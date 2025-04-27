import type { GuildDataSoundSnippet } from '$lib/snippets';
import type { Message } from 'discord.js';
import { eq } from 'drizzle-orm';
import { server } from '..';
import { db } from '../db';
import * as table from '../db/schema';

export class GuildState {
	readonly data: GuildData;

	constructor(readonly id: string) {
		this.data = new GuildData(this);
	}

	async processMessage(message: Message<true>) {
		const member = message.member!;

		console.log(member.displayName, message.cleanContent);
	}
}

export class GuildData {
	constructor(readonly guildState: GuildState) {}

	public static getPathToSound(id: string, { accessibleByFrontend = false }) {
		return server.assetManager.getPathToAsset(id, { accessibleByFrontend });
	}

	async delete() {
		const allSounds = await db
			.select({ assetPath: table.asset.path })
			.from(table.sound)
			.where(eq(table.sound.guildId, this.guildState.id))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		const allSoundAssetPaths = allSounds
			.map((sound) => sound.assetPath)
			.filter((assetPath) => assetPath !== null);

		await server.assetManager.disposeAssetsInBatch(allSoundAssetPaths.map((path) => ({ path })));
	}

	async createSound(userId: string, request: Request): Promise<GuildDataSoundSnippet> {
		const asset = await server.assetManager.uploadAsset(userId, request);

		const sound: table.Sound = {
			id: crypto.randomUUID(),
			assetId: asset.id,
			guildId: this.guildState.id,
			name: 'New Sound',
			keywords: ''
		};

		await db.insert(table.sound).values(sound);
		return {
			name: sound.name,
			keywords: sound.keywords,
			mediaPath: server.assetManager.resolveAssetPath(asset.path)
		};
	}
}
