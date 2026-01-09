-- create function to emit automation events when action runs succeed or fail
CREATE OR REPLACE FUNCTION emit_automation_result_event()
    RETURNS TRIGGER
    AS $$
DECLARE
    watched_automation RECORD;
    community RECORD;
    target_event "AutomationEvent";
    action_stack jsonb;
    source_automation_id text;
BEGIN
    -- only handle updates where status changes to success or failure
    IF TG_OP != 'UPDATE' THEN
        RETURN NEW;
    END IF;
    -- check if status changed to success or failure
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    IF NEW.status = 'success' THEN
        target_event := 'automationSucceeded';
    ELSIF NEW.status = 'failure' THEN
        target_event := 'automationFailed';
    ELSE
        RETURN NEW;
    END IF;
    -- get the automation id from the action run through automation_run
    SELECT
        arun."automationId" INTO source_automation_id
    FROM
        automation_runs arun
    WHERE
        arun.id = NEW."automationRunId";
    -- if no automation run found, nothing to do
    IF source_automation_id IS NULL THEN
        RETURN NEW;
    END IF;
    -- get community information from the source automation
    SELECT
        c.id,
        c.slug INTO community
    FROM
        automations a
        JOIN communities c ON a."communityId" = c.id
    WHERE
        a.id = source_automation_id;
    -- get the stack from the action run params, or use empty array
    action_stack := COALESCE(NEW.params -> 'stack', '[]'::jsonb);
    -- loop through all automation triggers that are watching this automation's result
    FOR watched_automation IN SELECT DISTINCT
        a.id AS "automationId",
        a."stageId"
    FROM
        automations a
        INNER JOIN automation_triggers at ON at."automationId" = a.id
    WHERE
        at."sourceAutomationId" = source_automation_id
        AND at.event = target_event LOOP
            -- emit an event for each watching automation
            -- append current action run to stack
            PERFORM
                graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', watched_automation."automationId", 'pubId', NEW."pubId", 'stageId', watched_automation."stageId", 'trigger', json_build_object('event', target_event, 'config', NULL), 'community', community, 'stack', action_stack || jsonb_build_array(NEW.id)));
        END LOOP;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- create trigger on action_runs table
CREATE TRIGGER automation_result_event
    AFTER UPDATE ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION emit_automation_result_event();

