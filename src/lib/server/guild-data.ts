import type {
	GuildDataCommandPatch,
	GuildDataCommandSnippet,
	GuildDataCommandSnippetPopulated,
	GuildDataSoundPatch,
	GuildDataSoundSnippet
} from '$lib/snippets';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { server } from '.';
import type { GuildState } from './bot/guild-state';
import { db } from './db';
import * as table from './db/schema';

export class GuildData {
	constructor(readonly guildState: GuildState) {}

	public static getPathToSound(id: string, { accessibleByFrontend = false }) {
		return server.assetManager.getPathToAsset(id, { accessibleByFrontend });
	}

	async delete() {
		const allSounds = await db
			.select({ assetId: table.asset.id, assetPath: table.asset.path })
			.from(table.sound)
			.leftJoin(table.command, eq(table.sound.commandId, table.command.id))
			.where(eq(table.command.guildId, this.guildState.id))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		await server.assetManager.deleteAssetsInBatch(
			allSounds.map((sound) => ({
				id: sound.assetId!,
				path: sound.assetPath!
			}))
		);
	}

	async createCommand({ name }: CreateCommandOptions): Promise<GuildDataCommandSnippetPopulated> {
		const command: table.Command = {
			id: crypto.randomUUID(),
			guildId: this.guildState.id,
			name: name
		};

		await db.insert(table.command).values(command);
		return {
			id: command.id,
			name: command.name,
			sounds: []
		};
	}

	private async readCommand(id: string) {
		const [command = undefined] = await db
			.select()
			.from(table.command)
			.where(and(eq(table.command.id, id), eq(table.command.guildId, this.guildState.id)));

		if (!command) {
			throw error(400, `Invalid command ID ${id}`);
		}

		return command;
	}

	async patchCommand({ id, patch }: PatchCommandOptions): Promise<GuildDataCommandSnippet> {
		const original = await this.readCommand(id);

		await db.update(table.command).set(patch).where(eq(table.command.id, id));

		return {
			id: original.id,
			name: original.name,
			...patch
		};
	}

	async deleteCommand({ id }: DeleteCommandOptions) {
		await this.readCommand(id);

		const sounds = await db
			.select({ id: table.sound.id })
			.from(table.sound)
			.where(eq(table.sound.commandId, id));

		if (sounds.length > 0) {
			throw error(400, `Can't delete command while sounds exist on it`);
		}

		await db.delete(table.command).where(eq(table.command.id, id));
	}

	async createSound({
		userId,
		commandId,
		name,
		request
	}: CreateSoundOptions): Promise<GuildDataSoundSnippet> {
		await this.readCommand(commandId);

		const asset = await server.assetManager.uploadAsset(userId, request);

		const sound: table.Sound = {
			id: crypto.randomUUID(),
			assetId: asset.id,
			commandId: commandId,
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

	private async readSound(id: string, userId: string) {
		const [original = undefined] = await db
			.select()
			.from(table.sound)
			.leftJoin(table.command, eq(table.sound.commandId, table.command.id))
			.where(and(eq(table.sound.id, id), eq(table.command.guildId, this.guildState.id)))
			.leftJoin(table.asset, eq(table.sound.assetId, table.asset.id));

		if (!original || !original.asset) {
			throw error(400, `Invalid sound ID ${id}`);
		}

		if (original.asset.createdBy !== userId) {
			throw error(403, { message: 'Sound is owned by a different user' });
		}

		return original;
	}

	async patchSound({ userId, id, patch }: PatchSoundOptions): Promise<GuildDataSoundSnippet> {
		const original = await this.readSound(id, userId);

		await db.update(table.sound).set(patch).where(eq(table.sound.id, id));

		return {
			id: original.sound.id,
			name: original.sound.name,
			keywords: original.sound.keywords,
			createdBy: original.asset!.createdBy,
			mediaPath: server.assetManager.resolveAssetPath(original.asset!.path),
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
			.leftJoin(table.command, eq(table.sound.commandId, table.command.id))
			.where(and(eq(table.command.guildId, this.guildState.id), eq(table.sound.id, id)))
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

interface CreateCommandOptions {
	name: string;
}

interface PatchCommandOptions {
	id: string;
	patch: GuildDataCommandPatch;
}

interface DeleteCommandOptions {
	id: string;
}

interface CreateSoundOptions {
	userId: string;
	commandId: string;
	name: string;
	request: Request;
}

interface PatchSoundOptions {
	userId: string;
	commandId: string;
	id: string;
	patch: GuildDataSoundPatch;
}

interface DeleteSoundOptions {
	userId: string;
	commandId: string;
	id: string;
}
