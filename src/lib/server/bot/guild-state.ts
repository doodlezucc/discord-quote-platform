import type { GuildDataSoundPatch, GuildDataSoundSnippet } from '$lib/snippets';
import { error } from '@sveltejs/kit';
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
			.select({ assetId: table.asset.id, assetPath: table.asset.path })
			.from(table.sound)
			.where(eq(table.sound.guildId, this.guildState.id))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		await server.assetManager.deleteAssetsInBatch(
			allSounds.map((sound) => ({
				id: sound.assetId!,
				path: sound.assetPath!
			}))
		);
	}

	async createSound({ userId, name, request }: CreateSoundOptions): Promise<GuildDataSoundSnippet> {
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
			mediaPath: server.assetManager.resolveAssetPath(asset.path),
			name: sound.name,
			keywords: sound.keywords,
			createdBy: userId
		};
	}

	async patchSound({ userId, id, patch }: PatchSoundOptions): Promise<GuildDataSoundSnippet> {
		const [original = undefined] = await db
			.select()
			.from(table.sound)
			.where(and(eq(table.sound.id, id), eq(table.sound.guildId, this.guildState.id)))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		if (!original || !original.asset) {
			throw error(400, `Invalid sound ID ${id}`);
		}

		if (original.asset.createdBy !== userId) {
			throw error(403, { message: 'Sound is owned by a different user' });
		}

		await db.update(table.sound).set(patch).where(eq(table.sound.id, id));

		return {
			id: original.sound.id,
			name: original.sound.name,
			keywords: original.sound.keywords,
			createdBy: original.asset.createdBy,
			mediaPath: server.assetManager.resolveAssetPath(original.asset.path),
			...patch
		};
	}

	async deleteSound({ userId, id }: DeleteSoundOptions) {
		const [entry = undefined] = await db
			.select({
				assetId: table.asset.id,
				assetPath: table.asset.path,
				assetOwner: table.asset.createdBy
			})
			.from(table.sound)
			.where(and(eq(table.sound.guildId, this.guildState.id), eq(table.sound.id, id)))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		if (!entry) {
			throw error(400, `Invalid sound ID ${id}`);
		}

		if (entry.assetOwner !== userId) {
			throw error(403, { message: 'Sound is owned by a different user' });
		}

		await server.assetManager.deleteAsset({ id: entry.assetId!, path: entry.assetPath! });
	}
}

interface CreateSoundOptions {
	userId: string;
	name: string;
	request: Request;
}

interface PatchSoundOptions {
	userId: string;
	id: string;
	patch: GuildDataSoundPatch;
}

interface DeleteSoundOptions {
	userId: string;
	id: string;
}
