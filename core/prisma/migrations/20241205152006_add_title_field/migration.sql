-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "title" TEXT;

-- defined in core/prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
-- we are replacing it with a more complex function that also updates the title
DROP TRIGGER IF EXISTS trigger_pub_values_update_pub ON "pub_values";
DROP FUNCTION IF EXISTS update_pub_updated_at();

CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
RETURNS TRIGGER AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs (
        "pubId" TEXT PRIMARY KEY,
        "value" TEXT
    ) ON COMMIT DROP;

    WITH tf AS (
        SELECT DISTINCT ON (inserted_deleted_rows."pubId") inserted_deleted_rows."pubId", inserted_deleted_rows."value" FROM inserted_deleted_rows 
            JOIN "pubs" p ON inserted_deleted_rows."pubId" = p."id"
            JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_deleted_rows."fieldId" AND pft."B" = p."pubTypeId" AND pft."isTitle" = true
    ) 
    INSERT INTO tmp_affected_pubs ("pubId", "value")
    SELECT DISTINCT "pubId", ("value" #>> '{}') FROM tf
    ON CONFLICT DO NOTHING;

    -- Combined update for both updatedAt and title
    UPDATE "pubs"
    SET 
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = CASE 
            WHEN TG_OP = 'DELETE' THEN NULL 
            ELSE COALESCE(tmp."value", "pubs"."title")
        END
    FROM (SELECT DISTINCT "pubId" FROM inserted_deleted_rows) AS affected
    LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
    WHERE "pubs"."id" = affected."pubId";

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pub_values_insert_pub
    AFTER INSERT ON "pub_values"
    REFERENCING NEW TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_update_pub
    AFTER UPDATE ON "pub_values"
    REFERENCING NEW TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_delete_pub
    AFTER DELETE ON "pub_values"
    REFERENCING OLD TABLE AS inserted_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();
