DROP TRIGGER IF EXISTS automation_result_event ON action_runs;

DROP FUNCTION IF EXISTS emit_automation_result_event();

CREATE OR REPLACE FUNCTION notify_change_automation_runs()
    RETURNS TRIGGER
    AS $$
DECLARE
    correct_row jsonb;
    community_id text;
BEGIN
    -- -- Changed the first part of this conditional to return early if the operation is deleting a pub
    -- IF (NEW."pubId" IS NULL) THEN
    --     RETURN NEW;
    -- ELSE
    --     correct_row = to_jsonb(NEW);
    -- END IF;
    SELECT
        INTO community_id "automations"."communityId"
    FROM
        "automation_runs"
        INNER JOIN "automations" ON "automation_runs"."automationId" = "automations"."id"
    WHERE
        "automation_runs"."id" = NEW."id";
    PERFORM
        notify_change(correct_row, community_id, TG_TABLE_NAME, TG_OP);
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER automation_runs_change_trigger
    AFTER INSERT OR UPDATE -- Removed delete
    ON automation_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_change_automation_runs();

