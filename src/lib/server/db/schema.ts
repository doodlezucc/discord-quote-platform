import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

function createdAt() {
	return integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);
}

export const guild = sqliteTable('guild', {
	id: text('id').primaryKey()
});

export const command = sqliteTable('command', {
	id: text('id').primaryKey(),
	guildId: text('guild_id')
		.references(() => guild.id)
		.notNull(),
	name: text('name').notNull(),
	createdAt: createdAt()
});

export const sound = sqliteTable('sound', {
	id: text('id').primaryKey(),
	commandId: text('command_id')
		.references(() => command.id)
		.notNull(),
	assetId: text('asset_id')
		.references(() => asset.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	keywords: text('keywords').notNull(),
	createdAt: createdAt()
});

export const asset = sqliteTable('asset', {
	id: text('id').primaryKey(),
	createdBy: text('created_by').notNull(),
	path: text('path').notNull(),
	mimeType: text('mime_type').notNull(),
	createdAt: createdAt()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Guild = typeof guild.$inferInsert;
export type Command = typeof command.$inferInsert;
export type Sound = typeof sound.$inferInsert;
export type Asset = typeof asset.$inferInsert;
export type Session = typeof session.$inferInsert;
