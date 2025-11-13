-- create function to emit automation events when actions succeed or fail
CREATE OR REPLACE FUNCTION emit_action_result_event()
    RETURNS TRIGGER
    AS $$
DECLARE
    automation RECORD;
    community RECORD;
    target_event "Event";
    action_stack jsonb;
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
        target_event := 'actionSucceeded';
    ELSIF NEW.status = 'failure' THEN
        target_event := 'actionFailed';
    ELSE
        RETURN NEW;
    END IF;
    -- get community information
    SELECT
        c.id,
        c.slug INTO community
    FROM
        action_instances ai
        JOIN stages s ON ai."stageId" = s.id
        JOIN communities c ON s."communityId" = c.id
    WHERE
        ai.id = NEW."actionInstanceId";
    -- get the stack from the action run params, or use empty array
    action_stack := COALESCE(NEW.params -> 'stack', '[]'::jsonb);
    -- loop through all automations triggered by this action's result
    FOR automation IN
    SELECT
        a.id AS "automationId"
    FROM
        automations a
    WHERE
        a."sourceActionInstanceId" = NEW."actionInstanceId"
        AND a.event = target_event LOOP
            -- emit an event for each automation
            -- append current action run to stack
            PERFORM
                graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', automation."automationId", 'pubId', NEW."pubId", 'stageId', (
                        SELECT
                            "stageId"
                        FROM action_instances
                        WHERE
                            id = NEW."actionInstanceId"), 'event', target_event, 'community', community, 'stack', action_stack || jsonb_build_array(NEW.id)));
        END LOOP;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- create trigger on action_runs table
CREATE TRIGGER action_result_event
    AFTER UPDATE ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION emit_action_result_event();

