import type { GuildDataSoundPatch, GuildDataSoundSnippet } from '$lib/snippets';
import type { Message } from 'discord.js';
import { and, eq } from 'drizzle-orm';
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

	async createSound(options: CreateSoundOptions): Promise<GuildDataSoundSnippet> {
		const { userId, name, request } = options;
		const asset = await server.assetManager.uploadAsset(userId, request);

		const sound: table.Sound = {
			id: crypto.randomUUID(),
			assetId: asset.id,
			guildId: this.guildState.id,
			name: name,
			keywords: ''
		};

		await db.insert(table.sound).values(sound);
		return {
			id: sound.id,
			name: sound.name,
			keywords: sound.keywords,
			mediaPath: server.assetManager.resolveAssetPath(asset.path)
		};
	}

	async patchSound(id: string, partialSound: GuildDataSoundPatch): Promise<GuildDataSoundSnippet> {
		const [original = undefined] = await db
			.select()
			.from(table.sound)
			.where(and(eq(table.sound.guildId, this.guildState.id), eq(table.sound.id, id)))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		if (!original) {
			throw new Error(`Invalid sound ID ${id}`);
		}

		await db.update(table.sound).set(partialSound).where(eq(table.sound.id, id));

		return {
			id: original.sound.id,
			name: original.sound.name,
			keywords: original.sound.keywords,
			mediaPath: server.assetManager.resolveAssetPath(original.asset!.path),
			...partialSound
		};
	}
}

interface CreateSoundOptions {
	userId: string;
	name: string;
	request: Request;
}
