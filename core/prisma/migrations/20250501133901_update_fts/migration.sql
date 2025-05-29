
CREATE OR REPLACE FUNCTION strip_html_tags(text_with_tags text)
RETURNS text AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(
                text_with_tags,
                '<[^>]+>', -- removes HTML tags
                ' ',
                'gi'
            ),
            '&[^;]+;', -- removes HTML entities
            ' ',
            'gi'
        ),
        '\s+', -- collapse multiple spaces
        ' ',
        'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Modified function to handle text aggregation with special RichText handling
CREATE OR REPLACE FUNCTION get_pub_values_text(pub_id text)
RETURNS text AS $$
    SELECT string_agg(
        CASE 
            -- When the field is RichText, strip HTML tags
            WHEN pf."schemaName" = 'RichText'::"CoreSchemaType" THEN 
                strip_html_tags(CAST(pv.value #>> '{}' AS TEXT))
            -- For all other fields, just get the raw value
            ELSE 
                CAST(pv.value #>> '{}' AS TEXT)
        END,
        ' '
    )
    FROM pub_values pv
    JOIN pub_fields pf ON pv."fieldId" = pf.id
    WHERE pv."pubId" = pub_id;
$$ LANGUAGE sql STABLE;

-- The generate_pub_search_vector function remains the same
CREATE OR REPLACE FUNCTION generate_pub_search_vector(new_title text, pub_id text)
RETURNS tsvector AS $$
BEGIN
    RETURN setweight(to_tsvector('english', COALESCE(new_title, '')), 'A') ||
           setweight(to_tsvector('english', COALESCE(
               get_pub_values_text(pub_id),
               ''
           )), 'B');
END;
$$ LANGUAGE plpgsql STABLE;


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
                generate_pub_search_vector(updates.new_title, updates."pubId")
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
  SELECT generate_pub_search_vector(title, id)
);