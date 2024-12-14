-- CreateEnum
CREATE TYPE "OperationType" AS ENUM(
    'insert',
    'update',
    'delete'
);

CREATE DOMAIN modified_by_type AS TEXT
CHECK (
    VALUE ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^unknown$|^system$'
);

CREATE OR REPLACE FUNCTION f_generic_history()
    RETURNS TRIGGER
    AS $$
DECLARE
    vc_insert_sql constant text := 'insert into ' || TG_TABLE_NAME || '_history ( "operationType", "oldRowData", "newRowData", "primaryKeyValue", "userId", "apiAccessTokenId", "actionRunId", "other" ) values ( $1, $2, $3, $4, $5, $6, $7, $8 )';
    v_message text;
    v_detail text;
    v_hint text;
    v_type text;
    v_id text;
    v_userId text;
    v_apiAccessTokenId text;
    v_actionRunId text;
    v_other text;
    v_oldRowData json;
    v_operationType "OperationType";
BEGIN

    v_type := split_part(NEW."lastModifiedBy", ':', 1);
    v_id := split_part(NEW."lastModifiedBy", ':', 2);

    CASE v_type
    WHEN 'user' THEN
        v_userId := v_id;
    WHEN 'api-access-token' THEN
        v_apiAccessTokenId := v_id;
    WHEN 'action-run' THEN
        v_actionRunId := v_id;
    ELSE
        IF v_type = 'system' THEN
            v_other := v_type;
        END IF;

    END CASE;

    IF TG_OP = 'INSERT' THEN
        -- if it's an insert on conflict, we'll treat it as an update,
        -- and we include the old row data as the new row data
        -- v_oldRowData := (select * from pub_values where "pubId" = NEW."pubId" and "fieldId" = NEW."fieldId");
        -- if v_oldRowData is not null then
        --     v_operationType := 'update'::"OperationType";
        -- else
        --     v_operationType := 'insert'::"OperationType";
        -- end if;


        EXECUTE vc_insert_sql
        USING 'insert'::"OperationType", NULL::json, row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    ELSIF (TG_OP = 'UPDATE'
            AND OLD IS DISTINCT FROM NEW) THEN
        EXECUTE vc_insert_sql
        USING 'update'::"OperationType", row_to_json(OLD), row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    ELSIF TG_OP = 'DELETE' THEN
        EXECUTE vc_insert_sql
        USING 'delete'::"OperationType", row_to_json(OLD), NULL::json, OLD."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    END IF;
        RETURN NULL;
-- we don't want to handle exceptions, it should just fail
-- EXCEPTION
--     WHEN OTHERS THEN
--         get stacked diagnostics v_message := MESSAGE_TEXT,
--         v_detail := PG_EXCEPTION_DETAIL,
--         v_hint := PG_EXCEPTION_HINT;
--         RAISE EXCEPTION 'SQLSTATE % in f_generic_history(%) on table %.%; MESSAGE=%; DETAIL=%; HINT=%; CODE=%;', SQLSTATE, TG_ARGV[0], TG_TABLE_SCHEMA, TG_TABLE_NAME, v_message, v_detail, v_hint 
--         RETURN NULL;
END;

$$
LANGUAGE plpgsql;
