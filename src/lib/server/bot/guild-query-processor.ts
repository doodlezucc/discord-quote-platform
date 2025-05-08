import { eq } from 'drizzle-orm';
import Fuse from 'fuse.js';
import { db } from '../db';
import * as table from '../db/schema';
import { Ring } from '../util/ring';
import { shuffleArray } from '../util/shuffle-array';

interface DatabaseSound {
	id: string;
	name: string;
	keywords: string;
	assetPath: string | null;
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

		const matchingSounds = this.filterMatchingSounds(allSounds, query);

		if (matchingSounds.length === 0) {
			return undefined;
		}

		return this.registerNewRing(queryId, matchingSounds);
	}

	private filterMatchingSounds(sounds: DatabaseSound[], query?: string): DatabaseSound[] {
		if (!query) {
			return sounds;
		}

		const fuse = new Fuse(sounds, {
			keys: ['name', 'keywords'],
			includeScore: true
		});
		const searchResults = fuse.search(query);

		return searchResults
			.filter((result) => result.score! < SEARCH_RESULT_THRESHOLD)
			.map((result) => result.item);
	}

	private registerNewRing(queryId: string, dbSounds: DatabaseSound[]) {
		const sounds = dbSounds.map<Sound>((sound) => ({
			id: sound.id,
			assetPath: sound.assetPath!
		}));

		shuffleArray(sounds);

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
