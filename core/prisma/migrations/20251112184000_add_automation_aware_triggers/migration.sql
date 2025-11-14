-- create function to emit automation events for pub stage changes
CREATE OR REPLACE FUNCTION emit_pub_stage_change_event()
    RETURNS TRIGGER
    AS $$
DECLARE
    automation RECORD;
    community RECORD;
    target_event "AutomationEvent";
BEGIN
    -- determine the event type based on operation
    IF TG_OP = 'INSERT' THEN
        target_event := 'pubEnteredStage';
    ELSIF TG_OP = 'DELETE' THEN
        target_event := 'pubLeftStage';
    ELSE
        RETURN NULL;
    END IF;
    -- get community information
    IF TG_OP = 'INSERT' THEN
        SELECT
            c.id,
            c.slug INTO community
        FROM
            pubs p
            JOIN communities c ON p."communityId" = c.id
        WHERE
            p.id = NEW."pubId";
    ELSIF TG_OP = 'DELETE' THEN
        SELECT
            c.id,
            c.slug INTO community
        FROM
            pubs p
            JOIN communities c ON p."communityId" = c.id
        WHERE
            p.id = OLD."pubId";
    END IF;
    -- loop through all automation triggers for this stage with the matching event
    FOR automation IN SELECT DISTINCT
        a.id AS "automationId",
        a."stageId"
    FROM
        automations a
        INNER JOIN automation_triggers at ON at."automationId" = a.id
    WHERE
        a."stageId" = CASE WHEN TG_OP = 'INSERT' THEN
            NEW."stageId"
        WHEN TG_OP = 'DELETE' THEN
            OLD."stageId"
        END
        AND at.event = target_event LOOP
            -- emit an event for each automation
            PERFORM
                graphile_worker.add_job('emitEvent', json_build_object('type', 'RunAutomation', 'automationId', automation."automationId", 'pubId', CASE WHEN TG_OP = 'INSERT' THEN
                            NEW."pubId"
                        WHEN TG_OP = 'DELETE' THEN
                            OLD."pubId"
                        END, 'stageId', CASE WHEN TG_OP = 'INSERT' THEN
                            NEW."stageId"
                        WHEN TG_OP = 'DELETE' THEN
                            OLD."stageId"
                        END, 'event', target_event, 'community', community, 'stack', '[]'::json));
        END LOOP;
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    ELSE
        RETURN OLD;
    END IF;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- create function to handle scheduling of pubInStageForDuration automations
CREATE OR REPLACE FUNCTION schedule_pub_in_stage_for_duration()
    RETURNS TRIGGER
    AS $$
DECLARE
    automation RECORD;
    community RECORD;
BEGIN
    -- only handle INSERT operations
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    -- get community information
    SELECT
        c.id,
        c.slug INTO community
    FROM
        pubs p
        JOIN communities c ON p."communityId" = c.id
    WHERE
        p.id = NEW."pubId";
    -- loop through all pubInStageForDuration automation triggers on this stage
    FOR automation IN SELECT DISTINCT
        a.id AS "automationId"
    FROM
        automations a
        INNER JOIN automation_triggers at ON at."automationId" = a.id
    WHERE
        a."stageId" = NEW."stageId"
        AND at.event = 'pubInStageForDuration' LOOP
            -- emit a scheduling event for each specific automation
            PERFORM
                graphile_worker.add_job('emitEvent', json_build_object('type', 'ScheduleDelayedAutomation', 'automationId', automation."automationId", 'pubId', NEW."pubId", 'stageId', NEW."stageId", 'community', community, 'stack', '[]'::json));
        END LOOP;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- create function to cancel scheduled automations when pub leaves stage
CREATE OR REPLACE FUNCTION cancel_scheduled_automations_on_pub_leave()
    RETURNS TRIGGER
    AS $$
DECLARE
    scheduled_run RECORD;
    community RECORD;
BEGIN
    -- only handle DELETE operations
    IF TG_OP != 'DELETE' THEN
        RETURN OLD;
    END IF;
    -- get community information
    SELECT
        c.id,
        c.slug INTO community
    FROM
        pubs p
        JOIN communities c ON p."communityId" = c.id
    WHERE
        p.id = OLD."pubId";
    -- loop through all scheduled action runs for this pub on this stage
    -- we need to traverse: action_runs -> automation_runs -> automations to find the stage
    FOR scheduled_run IN
    SELECT
        ar.id AS "actionRunId",
        arun.id AS "automationRunId",
        arun."automationId",
        a."stageId"
    FROM
        action_runs ar
        INNER JOIN automation_runs arun ON arun.id = ar."automationRunId"
        INNER JOIN automations a ON a.id = arun."automationId"
    WHERE
        ar."pubId" = OLD."pubId"
        AND a."stageId" = OLD."stageId"
        AND ar.status = 'scheduled'
        AND ar.event = 'pubInStageForDuration' LOOP
            -- emit cancellation event for each scheduled run
            PERFORM
                graphile_worker.add_job('emitEvent', json_build_object('type', 'CancelScheduledAutomation', 'actionRunId', scheduled_run."actionRunId", 'automationRunId', scheduled_run."automationRunId", 'automationId', scheduled_run."automationId", 'pubId', OLD."pubId", 'stageId', OLD."stageId", 'community', community));
        END LOOP;
    RETURN OLD;
END;
$$
LANGUAGE plpgsql
VOLATILE;

-- drop old trigger
DROP TRIGGER IF EXISTS pub_moved ON "PubsInStages";

-- create new triggers on PubsInStages table
CREATE TRIGGER pub_stage_change
    AFTER INSERT OR DELETE ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION emit_pub_stage_change_event();

CREATE TRIGGER schedule_duration_automations
    AFTER INSERT ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION schedule_pub_in_stage_for_duration();

CREATE TRIGGER cancel_scheduled_on_leave
    AFTER DELETE ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION cancel_scheduled_automations_on_pub_leave();

