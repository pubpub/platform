-- Create the search vector column
ALTER TABLE "pubs" ADD COLUMN "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "pubs_searchVector_idx" ON "pubs" USING GIN ("searchVector");


-- update existing trigger defined in amongst other 20241219131700_fix_title_update_trigger/migration.sql
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


    -- this is to handle 
    -- - the actual update of the title
    -- - the actual update of the searchVector
    -- - to ensure that the updatedAt is updated
    -- we first do this CTE to get the new title, bc we want to use it in the searchVector as well
    WITH updates AS (
        SELECT 
            affected."pubId",
            CASE 
                WHEN tmp."pubId" IS NULL THEN pubs."title"
                WHEN TG_OP = 'DELETE' OR tmp."value" IS NULL THEN NULL
                ELSE tmp."value"
            END AS new_title
        FROM (
            SELECT DISTINCT "pubId"
            FROM inserted_updated_deleted_rows
        ) AS affected
        LEFT JOIN tmp_affected_pubs tmp ON tmp."pubId" = affected."pubId"
        JOIN pubs ON pubs.id = affected."pubId"
    )
    UPDATE "pubs"
    SET
        "updatedAt" = CURRENT_TIMESTAMP,
        "title" = updates.new_title,
        -- we weight the searchVector based on the title and its values
        "searchVector" = (
            SELECT 
                setweight(to_tsvector('english', COALESCE(updates.new_title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(
                    (SELECT string_agg(CAST(value #>> '{}' AS TEXT), ' ')
                    FROM pub_values
                    WHERE "pubId" = updates."pubId"), 
                '')), 'B')
        )
    FROM updates
    WHERE "pubs"."id" = updates."pubId";

    RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Update existing data
UPDATE pubs
SET "searchVector" = (
  SELECT setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
         setweight(to_tsvector('english', COALESCE(
           (SELECT string_agg(CAST(value->>'value' AS TEXT), ' ')
            FROM pub_values
            WHERE "pubId" = pubs.id), ''
         )), 'B')
);
