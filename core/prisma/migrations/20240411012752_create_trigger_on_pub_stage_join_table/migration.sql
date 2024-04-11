CREATE
OR REPLACE FUNCTION emit_event() RETURNS trigger AS $$ BEGIN
PERFORM
    graphile_worker.add_job(
        'emitEvent',
        json_build_object(
            'table',
            TG_TABLE_NAME,
            'operation',
            TG_OP,
            'new',
            NEW,
            'old',
            OLD
        )
    );
    RETURN NEW;
END; $$ LANGUAGE plpgsql VOLATILE;

CREATE TRIGGER pub_entered
AFTER
INSERT
    OR
UPDATE
    ON "PubsInStages" FOR EACH ROW EXECUTE FUNCTION emit_event();