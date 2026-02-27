import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let _db: PostgresJsDatabase<typeof schema> | null = null;

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
	get(_, prop) {
		if (!_db) {
			if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
			_db = drizzle(postgres(env.DATABASE_URL), { schema });
		}
		return Reflect.get(_db, prop);
	}
});
