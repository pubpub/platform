CREATE OR REPLACE FUNCTION notify_change(
    correct_row jsonb,
    community_id text,
    table_name text,
    operation text
)
    RETURNS void AS
$$
DECLARE
    channel_name text;
BEGIN
    -- Changed to concat to avoid errors if commmunity_id or table_name are null
    channel_name = CONCAT('change', '_', community_id, '_', table_name);

    -- construct the notification payload
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'table', table_name,
            'operation', operation,
            'row', correct_row
        )::text
    );
END;
$$
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION notify_change_action_runs()
    RETURNS TRIGGER AS
$$
DECLARE
    correct_row jsonb;
    community_id text;
BEGIN

    -- Changed the first part of this conditional to return early if the operation is deleting a pub
    IF (NEW."pubId" IS NULL) THEN
        RETURN NEW;
    ELSE
        correct_row = to_jsonb(NEW);
    END IF;


    select into community_id "communityId" from "pubs" where "id" = correct_row->>'pubId'::text;

    PERFORM notify_change(
        correct_row,
        community_id,
        TG_TABLE_NAME,
        TG_OP
    );
    
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER action_runs_change_trigger
    AFTER INSERT OR UPDATE -- Removed delete
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_change_action_runs();
