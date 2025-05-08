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

const SEARCH_RESULT_THRESHOLD = 0.5;

export class GuildQueryProcessor {
	private queryResultRings = new Map<string, Ring<Sound>>();

	clearResultsOfCommand(commandId: string) {
		const unmodifiedKeys = [...this.queryResultRings.keys()];

		for (const key of unmodifiedKeys) {
			if (key.startsWith(commandId)) {
				this.queryResultRings.delete(key);
			}
		}
	}

	clearResultsContainingSound(soundId: string) {
		const unmodifiedEntries = [...this.queryResultRings.entries()];

		for (const [key, ring] of unmodifiedEntries) {
			if (ring.some((sound) => sound.id === soundId)) {
				this.queryResultRings.delete(key);
			}
		}
	}

	removeSoundFromResults(soundId: string) {
		for (const ring of this.queryResultRings.values()) {
			ring.removeWhere((sound) => sound.id === soundId);
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
		const activeSoundRing = this.queryResultRings.get(queryId);

		if (activeSoundRing) {
			activeSoundRing.rotate();
			return activeSoundRing;
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

		shuffleArray(matchingSounds);

		const ring = new Ring(
			matchingSounds.map<Sound>((sound) => ({
				id: sound.id,
				assetPath: sound.assetPath!
			}))
		);

		this.queryResultRings.set(queryId, ring);

		return ring;
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
}
