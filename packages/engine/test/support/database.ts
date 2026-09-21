import { Pool } from 'pg';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from "../../src/migrations.js";

export interface TestDatabase {
    container: StartedPostgreSqlContainer;
    pool: Pool;
    connectionUri: string;
    stop: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
    const container = await new PostgreSqlContainer("postgres:16.15").start();
    try {
        const connectionUri = container.getConnectionUri();
        const pool = new Pool({ connectionString: connectionUri });
        await migrate({ pool });
        return {
            container,
            pool,
            connectionUri,
            stop: async () => {
                await pool.end();
                await container.stop();
            },
        };
    } catch (err) {
        await container.stop();
        throw err;
    }
}
