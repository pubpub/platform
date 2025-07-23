-- basically, we ran into a problem where if eg a pub was deleted, then
-- the pubId on the invite_table would be set to null (but we don't want to delete the invite)
-- this triggers an update on the invite_history table without specifying a lastModifiedBy,
-- which is not allowed
-- we could solve this in a number of ways, but the easiest i think is to check whether some
-- id column is set to null, and if so, we manually set the lastModifiedBy to the system
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
        -- check if the timestamp is the same (indicating no explicit lastModifiedBy was set)
        IF v_timestamp_new = v_timestamp_old THEN
            -- check if this is an automated update (foreign key cascade set null)
            -- by looking for id columns that changed from not-null to null
            IF EXISTS (
                SELECT
                    1
                FROM
                    json_each_text(row_to_json(OLD)) old_vals
                    JOIN json_each_text(row_to_json(NEW)) new_vals ON old_vals.key = new_vals.key
                WHERE
                    old_vals.key LIKE '%Id'
                    AND old_vals.value IS NOT NULL
                    AND new_vals.value IS NULL) THEN
            -- this is an automated update, set to system
            v_other := 'system';
            v_timestamp_new := now();
        ELSE
            -- this is a missing lastModifiedBy, throw error
            RAISE EXCEPTION 'lastModifiedBy must be explicitly set in UPDATE';
        END IF;
    END IF;
        EXECUTE vc_insert_sql
        USING 'update'::"OperationType", row_to_json(OLD), row_to_json(NEW), NEW."id", v_userId, v_apiAccessTokenId, v_actionRunId, v_other;
    END IF;
        RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- This is an empty migration.
