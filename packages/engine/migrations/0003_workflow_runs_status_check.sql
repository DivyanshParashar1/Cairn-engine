ALTER TABLE workflow_runs
  ADD CONSTRAINT workflow_runs_status_check
  CHECK (status IN ('pending', 'running', 'waiting', 'completed', 'failed', 'cancelled'));
