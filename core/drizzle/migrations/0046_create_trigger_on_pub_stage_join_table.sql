CREATE OR REPLACE FUNCTION emit_event()
    RETURNS TRIGGER AS 
$$
BEGIN
    PERFORM
        graphile_worker.add_job(
            'emitEvent',
            json_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'new', NEW,
                'old', OLD
            )
        );
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
VOLATILE;

CREATE TRIGGER pub_moved
    AFTER INSERT OR DELETE ON "PubsInStages"
    FOR EACH ROW
    EXECUTE FUNCTION emit_event();
