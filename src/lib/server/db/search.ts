import { eq, getTableColumns, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { db } from './index';
import { sound } from './schema';

const soundSearchFts = sqliteTable('sound_search_fts', {
	rowid: integer('rowid'),
	name: text('name'),
	keywords: text('keywords'),
	id: text('id')
});

export function runFtsSoundSearch(input: string) {
	const sqlSearchPattern = buildSqlSearchPattern(input);
	if (!sqlSearchPattern) return [];

	const score = sql<number>`bm25(${soundSearchFts}, 10.0, 1.0)`;

	return db
		.select({ ...getTableColumns(sound), score })
		.from(soundSearchFts)
		.innerJoin(sound, eq(sound.id, soundSearchFts.id))
		.where(sql`${soundSearchFts} MATCH ${sqlSearchPattern}`)
		.orderBy(score)
		.all();
}

// Matches concatenated letters and digits, skips special characters.
const REGEX_SAFE_WORDS = /[\p{L}\p{N}]+/gu;

function buildSqlSearchPattern(input: string): string | null {
	const terms = input.toLowerCase().match(REGEX_SAFE_WORDS) ?? [];

	if (terms.length === 0) return null;

	return terms.map((term) => `"${term}"*`).join(' ');
}
