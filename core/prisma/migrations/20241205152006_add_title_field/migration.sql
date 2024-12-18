-- AlterTable
ALTER TABLE "pubs"
    ADD COLUMN "title" TEXT;

-- defined in core/prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
-- we are replacing it with a more complex function that also updates the title
DROP TRIGGER IF EXISTS trigger_pub_values_update_pub ON "pub_values";

DROP FUNCTION IF EXISTS update_pub_updated_at();

CREATE OR REPLACE FUNCTION update_pub_for_value_changes()
    RETURNS TRIGGER
    AS $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_affected_pubs(
        "pubId" text PRIMARY KEY,
        "value" text
    ) ON COMMIT DROP;
    WITH tf AS (
        SELECT DISTINCT ON (inserted_updated_deleted_rows."pubId")
            inserted_updated_deleted_rows."pubId",
            inserted_updated_deleted_rows."value",
            CASE WHEN inserted_updated_deleted_rows."value" IS NULL THEN
                TRUE
            ELSE
                FALSE
            END AS is_null_value
        FROM
            inserted_updated_deleted_rows
            JOIN "pubs" p ON inserted_updated_deleted_rows."pubId" = p."id"
            JOIN "_PubFieldToPubType" pft ON pft."A" = inserted_updated_deleted_rows."fieldId"
                AND pft."B" = p."pubTypeId"
                AND pft."isTitle" = TRUE
    )
    INSERT INTO tmp_affected_pubs("pubId", "value")
    SELECT DISTINCT
        "pubId",
        CASE WHEN is_null_value THEN
            NULL
        ELSE
            ("value" #>> '{}')
        END
    FROM tf
    -- this is to handle edge cases which mostly happen during "UPDATE"s in transactions
    ON CONFLICT("pubId")
        DO UPDATE SET
            "value" = CASE WHEN EXCLUDED."value" IS NULL THEN
                NULL
            ELSE
                EXCLUDED."value"
            END;


    -- this is to handle the actual update of the title
    -- and to ensure that the updatedAt is updated
    UPDATE
        "pubs"
    SET
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = CASE 
        WHEN tmp."pubId" IS NULL THEN
            pubs."title"
        WHEN TG_OP = 'DELETE' OR tmp."value" IS NULL THEN
            NULL
        ELSE
            tmp."value"
        END
    FROM ( SELECT DISTINCT
            "pubId"
        FROM
            inserted_updated_deleted_rows
    ) AS affected
    LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
    WHERE
        "pubs"."id" = affected."pubId";
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- these triggers run once for every batch of pub_values
-- we need to create separate triggers for insert, update and delete, as they cannot be combined
-- this is slightly more efficient than a single trigger that handles all three operations
-- and runs the same function for each row that has been changed, at the cost
-- of being slightly more complex
CREATE TRIGGER trigger_pub_values_insert_pub
    AFTER INSERT ON "pub_values" REFERENCING NEW TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_update_pub
    AFTER UPDATE ON "pub_values" REFERENCING NEW TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

CREATE TRIGGER trigger_pub_values_delete_pub
    AFTER DELETE ON "pub_values" REFERENCING OLD TABLE AS inserted_updated_deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_pub_for_value_changes();

-- backfill the title for all pubs
WITH values_titles AS (
    SELECT
        "pubId",
        ("value" #>> '{}') AS "title"
    FROM
        "pub_values"
        JOIN "pubs" ON "pub_values"."pubId" = "pubs"."id"
        JOIN "_PubFieldToPubType" pft ON pft."A" = "pub_values"."fieldId"
            AND pft."B" = "pubs"."pubTypeId"
            AND pft."isTitle" = TRUE)
    UPDATE
        "pubs"
    SET
        "title" = values_titles."title"
    FROM
        values_titles
WHERE
    "pubs"."id" = values_titles."pubId";

