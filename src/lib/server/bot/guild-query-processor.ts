import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import * as table from '../db/schema';
import { soundSearchFts } from '../db/search';
import { Ring } from '../util/ring';
import { shuffleArray } from '../util/shuffle-array';

export interface DatabaseSound {
	id: string;
	name: string;
	keywords: string;
	assetPath: string | null;
}

const DRIZZLE_SELECT_FROM_SOUND = {
	id: table.sound.id,
	name: table.sound.name,
	keywords: table.sound.keywords,
	assetPath: table.asset.path
};

interface Sound {
	id: string;
	assetPath: string;
}

interface QueryResultBucket {
	sounds: Ring<Sound>;
	invalidationTimeout: NodeJS.Timeout;
}

// Matches concatenated letters and digits, skips special characters.
const REGEX_SAFE_WORDS = /[\p{L}\p{N}]+/gu;

const RING_TIMEOUT_MILLISECONDS = 20 * 60 * 1000;

export class GuildQueryProcessor {
	private queryResultBuckets = new Map<string, QueryResultBucket>();

	clearResultsOfCommand(commandId: string) {
		const unmodifiedKeys = [...this.queryResultBuckets.keys()];

		for (const key of unmodifiedKeys) {
			if (key.startsWith(commandId)) {
				this.queryResultBuckets.delete(key);
			}
		}
	}

	clearResultsContainingSound(soundId: string) {
		const unmodifiedEntries = [...this.queryResultBuckets.entries()];

		for (const [key, bucket] of unmodifiedEntries) {
			if (bucket.sounds.some((sound) => sound.id === soundId)) {
				this.queryResultBuckets.delete(key);
			}
		}
	}

	removeSoundFromResults(soundId: string) {
		for (const bucket of this.queryResultBuckets.values()) {
			bucket.sounds.removeWhere((sound) => sound.id === soundId);
		}
	}

	async searchForSound(commandId: string, query?: string): Promise<Sound | null> {
		const rotatedRing = await this.rotateOrCreateSoundRing(commandId, query);
		return rotatedRing?.currentItem ?? null;
	}

	private async rotateOrCreateSoundRing(
		commandId: string,
		query?: string
	): Promise<Ring<Sound> | null> {
		query = query?.trim();

		const queryId = `${commandId}${query ?? ''}`;
		const activeResultBucket = this.queryResultBuckets.get(queryId);

		if (activeResultBucket) {
			activeResultBucket.sounds.rotate();

			clearTimeout(activeResultBucket.invalidationTimeout);
			activeResultBucket.invalidationTimeout = this.createInvalidationTimeout(queryId);

			return activeResultBucket.sounds;
		}

		const matchingSounds = await this.findMatchingSounds(commandId, query);

		if (matchingSounds.length === 0) {
			return null;
		}

		return this.registerNewRing(queryId, matchingSounds);
	}

	private async findMatchingSounds(commandId: string, query?: string): Promise<DatabaseSound[]> {
		if (!query) {
			return await this.listAllSounds(commandId);
		} else {
			return await this.searchMatchingSounds(commandId, query);
		}
	}

	private async listAllSounds(commandId: string): Promise<DatabaseSound[]> {
		const result = await db
			.select({
				id: table.sound.id,
				name: table.sound.name,
				keywords: table.sound.keywords,
				assetPath: table.asset.path
			})
			.from(table.sound)
			.where(eq(table.sound.commandId, commandId))
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

		shuffleArray(result);
		return result;
	}

	private async searchMatchingSounds(commandId: string, query: string): Promise<DatabaseSound[]> {
		const sqlSearchPattern = this.buildSqlSearchPattern(query);
		if (!sqlSearchPattern) return [];

		const searchResults = await db
			.select(DRIZZLE_SELECT_FROM_SOUND)
			.from(soundSearchFts)
			.innerJoin(table.sound, eq(table.sound.id, soundSearchFts.id))
			.where(
				and(eq(table.sound.commandId, commandId), sql`${soundSearchFts} MATCH ${sqlSearchPattern}`)
			)
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

		shuffleArray(searchResults);
		return searchResults;
	}

	private buildSqlSearchPattern(input: string): string | null {
		const terms = input.toLowerCase().match(REGEX_SAFE_WORDS) ?? [];

		if (terms.length === 0) return null;

		return terms.map((term) => `"${term}"*`).join(' ');
	}

	private registerNewRing(queryId: string, dbSounds: DatabaseSound[]) {
		const sounds = dbSounds.map<Sound>((sound) => ({
			id: sound.id,
			assetPath: sound.assetPath!
		}));

		const ring = new Ring(sounds);

		this.queryResultBuckets.set(queryId, {
			sounds: ring,
			invalidationTimeout: this.createInvalidationTimeout(queryId)
		});

		return ring;
	}

	private createInvalidationTimeout(queryId: string) {
		return setTimeout(() => {
			this.queryResultBuckets.delete(queryId);
		}, RING_TIMEOUT_MILLISECONDS);
	}
}
