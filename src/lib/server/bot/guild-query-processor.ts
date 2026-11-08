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

const SEARCH_RESULT_THRESHOLD = 0.5;
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

	async searchForSound(commandId: string, query?: string): Promise<Sound | undefined> {
		const rotatedRing = await this.rotateOrCreateSoundRing(commandId, query);
		return rotatedRing?.currentItem;
	}

	private async rotateOrCreateSoundRing(
		commandId: string,
		query?: string
	): Promise<Ring<Sound> | undefined> {
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
			return undefined;
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
		const results = await db
			.select({
				id: table.sound.id,
				name: table.sound.name,
				keywords: table.sound.keywords,
				assetPath: table.asset.path
			})
			.from(table.sound)
			.where(eq(table.sound.commandId, commandId))
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

		shuffleArray(results);
		return results;
	}

	private buildSqlSearchPattern(input: string): string | null {
		const terms = input.toLowerCase().match(REGEX_SAFE_WORDS) ?? [];

		if (terms.length === 0) return null;

		return terms.map((term) => `"${term}"*`).join(' ');
	}

	private async searchMatchingSounds(commandId: string, query: string): Promise<DatabaseSound[]> {
		const sqlSearchPattern = this.buildSqlSearchPattern(query);
		if (!sqlSearchPattern) return [];

		const weightName = 1.0;
		const weightKeywords = 1.0;

		const score = sql<number>`bm25(${soundSearchFts}, ${weightName}, ${weightKeywords})`;

		const searchResults = await db
			.select({ ...DRIZZLE_SELECT_FROM_SOUND, score })
			.from(soundSearchFts)
			.innerJoin(table.sound, eq(table.sound.id, soundSearchFts.id))
			.where(
				and(eq(table.sound.commandId, commandId), sql`${soundSearchFts} MATCH ${sqlSearchPattern}`)
			)
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId))
			.orderBy(score);

		const results = searchResults.filter((result) => result.score! < SEARCH_RESULT_THRESHOLD);

		const similarScoreBucketMapping = Object.groupBy(results, ({ score }) =>
			Math.round(score! * 100)
		);
		const similarScoreBuckets = Object.values(similarScoreBucketMapping).filter(
			(bucket) => bucket !== undefined
		);

		for (const bucket of similarScoreBuckets) {
			shuffleArray(bucket);
		}

		return similarScoreBuckets.reduce((result, bucket) => [...result, ...bucket], []);
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
