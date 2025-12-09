-- add 'pending' status to ActionRunStatus enum
ALTER TYPE "ActionRunStatus"
  ADD VALUE 'pending';

-- add nullable status column to automation_runs
ALTER TABLE "automation_runs"
  ADD COLUMN "status" "ActionRunStatus";

-- function to build automation run stack by recursively following sourceAutomationRunId
CREATE OR REPLACE FUNCTION build_automation_run_stack(run_id text)
  RETURNS jsonb
  AS $$
DECLARE
  stack jsonb := '[]'::jsonb;
  current_run_id text := run_id;
  source_run_id text;
BEGIN
  -- recursively build stack by following sourceAutomationRunId backwards
  WITH RECURSIVE automation_run_stack AS (
    SELECT
      "sourceAutomationRunId" AS "automationRunId",
      '[]'::jsonb AS "stack"
    FROM
      automation_runs
    WHERE
      id = run_id
    UNION ALL
    SELECT
      "sourceAutomationRunId" AS "automationRunId",
      "automation_run_stack"."stack" || jsonb_build_array(id) AS "stack"
    FROM
      automation_runs
      INNER JOIN automation_run_stack ON "sourceAutomationRunId" = "automation_run_stack"."automationRunId"
)
  SELECT
    automation_run_stack."stack" INTO stack
  FROM
    automation_run_stack
  WHERE
    "automationRunId" = run_id;
  RETURN stack;
END;
$$
LANGUAGE plpgsql
STABLE;

-- function to compute automation_run status from its action_runs
-- maintains invariant: automation_run.status = aggregate(action_runs.status)
CREATE OR REPLACE FUNCTION compute_automation_run_status()
  RETURNS TRIGGER
  AS $$
DECLARE
  new_status "ActionRunStatus";
  old_status "ActionRunStatus";
  target_event "AutomationEvent";
  community RECORD;
  action_stack jsonb;
  source_automation_id text;
  watched_automation RECORD;
BEGIN
  -- early returns: skip if no automation run or status unchanged
  IF NEW."automationRunId" IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  -- get current status before update
  SELECT
    status INTO old_status
  FROM
    automation_runs
  WHERE
    id = NEW."automationRunId";
  -- compute new status from all action_runs
  SELECT
    CASE WHEN COUNT(*) FILTER (WHERE status = 'failure') > 0 THEN
      'failure'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'success') THEN
      'success'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'scheduled') THEN
      'scheduled'::"ActionRunStatus"
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'pending') THEN
      'pending'::"ActionRunStatus"
    ELSE
      'pending'::"ActionRunStatus"
    END INTO new_status
  FROM
    action_runs
  WHERE
    "automationRunId" = NEW."automationRunId";
  -- if no action runs exist, leave status as null
  IF new_status IS NULL THEN
    RETURN NEW;
  END IF;
  -- update automation_run status
  UPDATE
    automation_runs
  SET
    status = new_status
  WHERE
    id = NEW."automationRunId";
  -- emit sequential automation events on terminal status
  IF new_status IN ('success', 'failure') AND (old_status IS NULL OR old_status != new_status) THEN
    -- determine event type
    target_event := CASE WHEN new_status = 'success' THEN
      'automationSucceeded'
    ELSE
      'automationFailed'
    END;
    -- get automation and community info
    SELECT
      "automationId" INTO source_automation_id
    FROM
      automation_runs
    WHERE
      id = NEW."automationRunId";
    IF source_automation_id IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT
      c.id,
      c.slug INTO community
    FROM
      automations a
      JOIN communities c ON a."communityId" = c.id
    WHERE
      a.id = source_automation_id;
    -- build stack recursively from sourceAutomationRunId chain
    action_stack := build_automation_run_stack(NEW."automationRunId");
    -- emit event for each watching automation
    FOR watched_automation IN SELECT DISTINCT
      a.id AS "automationId",
      a."stageId"
    FROM
      automations a
      INNER JOIN automation_triggers at ON at."automationId" = a.id
    WHERE
      at."sourceAutomationId" = source_automation_id
      AND at.event = target_event LOOP
        PERFORM
          graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', watched_automation."automationId", 'pubId', NEW."pubId", 'stageId', watched_automation."stageId", 'trigger', json_build_object('event', target_event, 'config', NULL), 'community', community, 'stack', action_stack || jsonb_build_array(NEW."automationRunId")));
      END LOOP;
  END IF;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- create trigger on action_runs table
CREATE TRIGGER compute_automation_run_status_trigger
  AFTER INSERT OR UPDATE ON action_runs
  FOR EACH ROW
  EXECUTE FUNCTION compute_automation_run_status();

