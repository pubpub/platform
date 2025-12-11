-- This adds back the status column on the automation run stable. This is computed from the status of the action runs. And when it changes, it will trigger an automation run finished event which might trigger sending like an emit event to the job skew. So other automations can like run based on the success or failure of a certain automation.
--
-- add 'pending' status to ActionRunStatus enum
ALTER TYPE "ActionRunStatus"
  ADD VALUE 'pending';

-- add nullable status column to automation_runs
ALTER TABLE "automation_runs"
  ADD COLUMN "status" "ActionRunStatus";

-- function to build automation run stack by recursively following sourceAutomationRunId
CREATE OR REPLACE FUNCTION build_automation_run_stack(run_id text)
  RETURNS text[]
  AS $$
DECLARE
  path text[];
  current_run_id text := run_id;
  source_run_id text;
BEGIN
  -- recursively build stack by following sourceAutomationRunId backwards
  -- returns array of ancestor run IDs (not including the current run)
  WITH RECURSIVE automation_run_stack AS (
    -- base case: start with the immediate source if it exists
    SELECT
      source_ar.id,
      source_ar."sourceAutomationRunId",
      ARRAY[source_ar.id] AS "path",
      0 AS "depth"
    FROM
      automation_runs ar
      INNER JOIN automation_runs source_ar ON source_ar.id = ar."sourceAutomationRunId"
    WHERE
      ar.id = run_id
      -- recursive case: walk backwards through the chain
    UNION ALL
    SELECT
      ar.id,
      ar."sourceAutomationRunId",
      ARRAY[ar.id] || "automation_run_stack"."path" AS "path",
      "automation_run_stack"."depth" + 1 AS "depth"
    FROM
      automation_runs ar
      INNER JOIN automation_run_stack ON ar."id" = "automation_run_stack"."sourceAutomationRunId"
    WHERE
      "automation_run_stack"."depth" < 20
      AND NOT ar."id" = ANY ("automation_run_stack"."path"))
  SELECT
    automation_run_stack."path" INTO path
  FROM
    automation_run_stack
  ORDER BY
    automation_run_stack."depth" DESC
  LIMIT 1;
  -- if no path found, return empty array
  IF path IS NULL THEN
    path := ARRAY[]::text[];
  END IF;
  RETURN path;
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
  action_stack text[];
  source_automation_id text;
  source_automation_run_id text := NULL;
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
    SELECT
      ar."sourceAutomationRunId" INTO source_automation_run_id
    FROM
      automation_runs ar
    WHERE
      ar.id = NEW."automationRunId";
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
          graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', watched_automation."automationId", 'sourceAutomationRunId', source_automation_run_id, 'automationRunId', NEW."automationRunId", 'pubId', NEW."pubId", 'stageId', watched_automation."stageId", 'trigger', json_build_object('event', target_event, 'config', NULL), 'community', community, 'stack', action_stack || ARRAY[NEW."automationRunId"]));
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

