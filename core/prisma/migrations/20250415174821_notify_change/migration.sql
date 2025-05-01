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
    channel_name = 'change' || '_' || community_id || '_' || table_name;

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


CREATE OR REPLACE FUNCTION notify_change_generic()
    RETURNS TRIGGER AS 
$$
DECLARE
    correct_row jsonb;
    community_id text;
    channel_name text;
BEGIN
    -- check if tg_argv[0] and tg_argv[1] are defined
    IF (TG_OP = 'UPDATE') THEN
            correct_row = to_jsonb(NEW);
            community_id = NEW."communityId";
    ELSIF (TG_OP = 'INSERT') THEN
            correct_row = to_jsonb(NEW);
            community_id = NEW."communityId";
    ELSIF (TG_OP = 'DELETE') THEN
            correct_row = to_jsonb(OLD);
            community_id = OLD."communityId";
    END IF;

    -- construct the notification payload
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

CREATE OR REPLACE FUNCTION notify_change_action_runs()
    RETURNS TRIGGER AS
$$
DECLARE
    correct_row jsonb;
    community_id text;
BEGIN

    IF (TG_OP = 'DELETE') THEN
        correct_row = to_jsonb(OLD);
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
    AFTER INSERT OR UPDATE OR DELETE
    ON action_runs
    FOR EACH ROW 
    EXECUTE FUNCTION notify_change_action_runs();
