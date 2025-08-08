import { eq } from 'drizzle-orm';
import Fuse, { type FuseResult } from 'fuse.js';
import { db } from '../db';
import * as table from '../db/schema';
import { Ring } from '../util/ring';
import { shuffleArray } from '../util/shuffle-array';

export interface DatabaseSound {
	id: string;
	name: string;
	keywords: string;
	assetPath: string | null;
}

interface SearchableSound {
	source: DatabaseSound;
	name: string;
	keywords: string[];
}

interface Sound {
	id: string;
	assetPath: string;
}

interface QueryResultBucket {
	sounds: Ring<Sound>;
	invalidationTimeout: NodeJS.Timeout;
}

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

		const allSounds: DatabaseSound[] = await db
			.select({
				id: table.sound.id,
				name: table.sound.name,
				keywords: table.sound.keywords,
				assetPath: table.asset.path
			})
			.from(table.sound)
			.where(eq(table.sound.commandId, commandId))
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

		const matchingSounds = this.listMatchingSounds(allSounds, query);

		if (matchingSounds.length === 0) {
			return undefined;
		}

		return this.registerNewRing(queryId, matchingSounds);
	}

	searchMatchingSounds(sounds: DatabaseSound[], query: string): FuseResult<SearchableSound>[] {
		const searchableSounds = sounds.map<SearchableSound>((sound) => ({
			source: sound,
			name: sound.name,
			keywords: sound.keywords.split(/\s+/gm)
		}));

		const fuse = new Fuse(searchableSounds, {
			keys: ['name', 'keywords'],
			includeScore: true,
			ignoreFieldNorm: true
		});

		const results = fuse.search(query).filter((result) => result.score! < SEARCH_RESULT_THRESHOLD);

		const similarScoreBucketMapping = Object.groupBy(results, ({ score }) =>
			Math.round(score! * 100)
		);
		const similarScoreBuckets = Object.values(similarScoreBucketMapping).map((bucket) => bucket!);

		for (const bucket of similarScoreBuckets) {
			shuffleArray(bucket!);
		}

		return similarScoreBuckets.reduce((result, bucket) => [...result, ...bucket!], []);
	}

	private listMatchingSounds(sounds: DatabaseSound[], query?: string): DatabaseSound[] {
		if (!query) {
			return sounds;
		}

		const searchResults = this.searchMatchingSounds(sounds, query);
		return searchResults.map((result) => result.item.source);
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
