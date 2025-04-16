CREATE OR REPLACE FUNCTION notify_action_run_update()
    RETURNS TRIGGER AS 
$$
BEGIN
    -- construct the notification payload
    PERFORM pg_notify(
        'action_run_updates',
        json_build_object(
            'id', NEW.id,
            'status', NEW.status,
            'result', NEW.result,
            'actionInstanceId', NEW."actionInstanceId",
            'pubId', NEW."pubId"
        )::text
    );
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER action_run_update_trigger
    AFTER UPDATE OF status 
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_action_run_update();

CREATE TRIGGER action_run_create_trigger
    AFTER INSERT
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_action_run_update();