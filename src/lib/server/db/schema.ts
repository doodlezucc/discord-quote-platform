import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guild = sqliteTable('guild', {
	id: text('id').primaryKey()
});

export const sound = sqliteTable('sound', {
	id: text('id').primaryKey(),
	guildId: text('guild_id')
		.references(() => guild.id)
		.notNull(),
	assetId: text('asset_id')
		.references(() => asset.id, { onDelete: 'cascade' })
		.notNull(),
	keywords: text('keywords').notNull()
});

export const asset = sqliteTable('asset', {
	id: text('id').primaryKey(),
	createdBy: text('created_by').notNull(),
	path: text('path').notNull(),
	mimeType: text('mime_type').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Guild = typeof guild.$inferSelect;
export type Sound = typeof sound.$inferSelect;
export type Asset = typeof asset.$inferSelect;
export type Session = typeof session.$inferSelect;
