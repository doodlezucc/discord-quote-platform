import { test } from 'vitest';
import { GuildQueryProcessor, type DatabaseSound } from './guild-query-processor';

import sounds from './sounds.json';

test('Orders search results in relevant order', () => {
	const databaseSounds: DatabaseSound[] = sounds.map((sound) => ({
		...sound,
		id: sound.name,
		assetPath: sound.name
	}));

	const queryProcessor = new GuildQueryProcessor();

	const matchingSounds = queryProcessor.searchMatchingSounds(databaseSounds, 'lenny');

	console.log(matchingSounds);
});
