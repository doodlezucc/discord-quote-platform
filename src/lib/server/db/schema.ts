import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guild = sqliteTable('guild', {
	id: text('id').primaryKey()
});

export const clip = sqliteTable('clip', {
	id: text('id').primaryKey(),
	guild: text('guild_id')
		.references(() => guild.id)
		.notNull(),
	keywords: text('keywords').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Guild = typeof guild.$inferSelect;
export type Clip = typeof clip.$inferSelect;
export type Session = typeof session.$inferSelect;
