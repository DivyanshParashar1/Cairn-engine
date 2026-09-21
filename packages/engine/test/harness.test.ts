import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "./support/database.js";

describe("test database harness", () => {
  let db!: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
  }, 60_000);

  afterAll(async () => {
    await db.stop();
  });

  it("applies migrations on startup", async () => {
    const result = await db.pool.query<{ version: number; name: string }>(
      "SELECT version, name FROM schema_migrations ORDER BY version",
    );
    expect(result.rows.map((r) => r.version)).toEqual([1, 2, 3]);
  });

  it("workflow_runs and journal_entries are queryable", async () => {
    const insert = await db.pool.query<{ id: string }>(
      "INSERT INTO workflow_runs (workflow_name) VALUES ('probe') RETURNING id",
    );
    const runId = insert.rows[0]!.id;

    await db.pool.query(
      "INSERT INTO journal_entries (run_id, ordinal, entry_type, step_name) VALUES ($1, 1, 'step', 'probe-step')",
      [runId],
    );

    const count = await db.pool.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM journal_entries WHERE run_id = $1",
      [runId],
    );
    expect(count.rows[0]!.count).toBe(1);
  });
});
