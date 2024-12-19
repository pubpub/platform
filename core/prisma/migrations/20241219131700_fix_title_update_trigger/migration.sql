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
        -- this is what's changed from the earlier function
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