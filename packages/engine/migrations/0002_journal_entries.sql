CREATE TABLE journal_entries (
  run_id       UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  ordinal      INTEGER NOT NULL CHECK (ordinal >= 1),
  entry_type   TEXT NOT NULL
               CHECK (entry_type IN ('step', 'now', 'random', 'uuid', 'sleep', 'patched')),
  step_name    TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'failed')),
  input        JSONB,
  result       JSONB,
  error        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (run_id, ordinal),
  CHECK ((entry_type = 'step' AND step_name IS NOT NULL) OR entry_type <> 'step')
);
