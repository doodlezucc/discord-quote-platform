import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const soundSearchFts = sqliteTable('sound_search_fts', {
	rowid: integer('rowid'),
	name: text('name'),
	keywords: text('keywords'),
	id: text('id')
});
