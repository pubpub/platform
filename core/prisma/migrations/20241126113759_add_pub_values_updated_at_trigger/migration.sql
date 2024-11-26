CREATE OR REPLACE FUNCTION update_pub_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a temp table if it doesn't exist to store affected pubIds
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs (
        "pubId" TEXT PRIMARY KEY
    ) ON COMMIT DROP;

    -- Insert pubIds from modified rows based on operation type
    INSERT INTO tmp_affected_pubs ("pubId")
    SELECT DISTINCT "pubId" FROM inserted_deleted_rows
    ON CONFLICT DO NOTHING;

    -- Update pubs table using the collected pubIds
    UPDATE "pubs"
    SET "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" IN (SELECT "pubId" FROM tmp_affected_pubs);

    -- Temp table will be dropped automatically at end of transaction
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create separate triggers for each operation
CREATE TRIGGER trigger_pub_values_insert_pub
    AFTER INSERT ON "pub_values"
    REFERENCING NEW TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_updated_at();

CREATE TRIGGER trigger_pub_values_update_pub
    AFTER UPDATE ON "pub_values"
    REFERENCING NEW TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_updated_at();

CREATE TRIGGER trigger_pub_values_delete_pub
    AFTER DELETE ON "pub_values"
    REFERENCING OLD TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_updated_at();
