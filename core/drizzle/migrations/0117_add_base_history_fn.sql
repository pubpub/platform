-- CreateEnum
CREATE TYPE "OperationType" AS ENUM(
    'insert',
    'update',
    'delete'
);

CREATE DOMAIN modified_by_type AS TEXT CHECK (VALUE ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\|\d+$|^(unknown|system)\|\d+$');

CREATE OR REPLACE FUNCTION f_generic_history()
    RETURNS TRIGGER
    AS $$
DECLARE
    v_primary_key_column_name text := TG_ARGV[0];
    vc_insert_sql constant text := 'insert into ' || TG_TABLE_NAME || '_history ( "operationType", "oldRowData", "newRowData",  "' || v_primary_key_column_name || '", "userId", "apiAccessTokenId", "actionRunId", "other" ) values ( $1, $2, $3, $4, $5, $6, $7, $8 )';
    v_message text;
    v_detail text;
    v_hint text;
    v_last_modified_by_minus_timestamp text;
    v_type text;
    v_id text;
    v_userId text;
    v_apiAccessTokenId text;
    v_actionRunId text;
    v_other text;
    v_oldRowData json;
    v_operationType "OperationType";
    v_timestamp_new text;
    v_timestamp_old text;
BEGIN
    v_last_modified_by_minus_timestamp := split_part(NEW."lastModifiedBy", '|', 1);
    v_type := split_part(v_last_modified_by_minus_timestamp, ':', 1);
    v_id := split_part(v_last_modified_by_minus_timestamp, ':', 2);
    v_timestamp_new := split_part(NEW."lastModifiedBy", '|', 2);
    v_timestamp_old := split_part(OLD."lastModifiedBy", '|', 2);
    CASE v_type
    WHEN 'user' THEN
        v_userId := v_id;
    WHEN 'api-access-token' THEN
        v_apiAccessTokenId := v_id;
    WHEN 'action-run' THEN
        v_actionRunId := v_id;
    ELSE
        IF v_last_modified_by_minus_timestamp = 'system' THEN
                v_other := 'system';
            ELSIF v_last_modified_by_minus_timestamp = 'unknown' THEN
                v_other := NULL;
            ELSE
                RAISE EXCEPTION 'Invalid lastModifiedBy: %', NEW."lastModifiedBy";
            END IF;
    END CASE;
    IF TG_OP = 'INSERT' THEN
        EXECUTE vc_insert_sql
        USING 'insert'::"OperationType", NULL::json, row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    ELSIF (TG_OP = 'UPDATE'
            AND OLD IS DISTINCT FROM NEW) THEN
        -- this is extremely annoying but there's no real other way to check whether
        -- the `lastModifiedBy` is actually set
        -- during the update trigger
        -- as it's not possible to just get the values of the columns of the actual update
        IF v_timestamp_new = v_timestamp_old THEN
            RAISE EXCEPTION 'lastModifiedBy must be explicitly set in UPDATE';
        END IF;
        EXECUTE vc_insert_sql
        USING 'update'::"OperationType", row_to_json(OLD), row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    END IF;
        RETURN NULL;
END;
$$
LANGUAGE plpgsql;

