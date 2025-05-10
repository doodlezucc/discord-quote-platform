import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

function createDatabaseConnection() {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

	const client = new Database(env.DATABASE_URL);
	return drizzle(client, { schema });
}

export let db: ReturnType<typeof createDatabaseConnection>;

if (!building) {
	db = createDatabaseConnection();
}
