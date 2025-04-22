CREATE OR REPLACE FUNCTION notify_change()
    RETURNS TRIGGER AS 
$$
DECLARE
    correct_row jsonb;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        correct_row = to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        correct_row = to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        correct_row = to_jsonb(OLD);
    END IF;

    -- construct the notification payload
    PERFORM pg_notify(
        'change',
        json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'row', correct_row
        )::text
    );
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER action_runs_change_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_change();
