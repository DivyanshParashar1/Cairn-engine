import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from "pg";

const LOCK_ID_SQL = `hashtext('cairn:schema_migrations')::bigint`;
const MIGRATIONS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations')
const FILENAME_RE = /^(\d{4})_[a-z0-9_]+\.sql$/;

export async function migrate({ pool }: { pool: Pool }): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`SELECT pg_advisory_lock(hashtext('cairn:schema_migrations')::bigint)`);
        try {
            await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
            const { rows } = await client.query(`SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations`);
            const currentVersion = rows[0]?.v ?? 0;

            const entries = await readdir(MIGRATIONS_DIR);
            const pending = entries.map((name) => {
                const match = FILENAME_RE.exec(name);
                if (!match) {
                    console.warn(`migrate: skipping non-migration file ${name}`);
                    return null;
                }
                return { name, version: Number(match[1]) }

            })
                .filter((x): x is { name: string; version: number } => x !== null)
                .filter((f) => f.version > currentVersion)
                .sort((a, b) => a.version - b.version);

            for (const file of pending) {
                const sql = await readFile(resolve(MIGRATIONS_DIR, file.name), 'utf8');
                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query(`INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`,
                        [file.version, file.name],
                    );
                    await client.query('COMMIT');
                } catch (err) {
                    await client.query('ROLLBACK');
                    throw new Error(
                        `migrate: failed on ${file.name}: ${(err as Error).message}`,
                        { cause: err },
                    );
                }
            }
        } finally {
            await client.query(`SELECT pg_advisory_unlock(${LOCK_ID_SQL})`);
        }
    } finally {
        client.release();
    }
}