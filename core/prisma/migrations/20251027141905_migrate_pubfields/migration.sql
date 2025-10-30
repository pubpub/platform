-- create a function to migrate a single action instance config
-- this function is kept after migration for testing purposes
CREATE OR REPLACE FUNCTION migrate_action_instance_pubfields(config_json jsonb)
    RETURNS jsonb
    AS $$
DECLARE
    new_config jsonb;
    pub_fields jsonb;
    key text;
    field_array jsonb;
    field_slug text;
    full_field_slug text;
    current_value jsonb;
    fallback_str text;
    interpolation text;
BEGIN
    new_config := config_json;
    pub_fields := config_json -> 'pubFields';
    IF pub_fields IS NULL OR pub_fields = '{}'::jsonb THEN
        RETURN config_json;
    END IF;
    FOR key,
    field_array IN
    SELECT
        *
    FROM
        jsonb_each(pub_fields)
        LOOP
            -- skip if the value is not an array or is an empty array: means it's not set
            IF jsonb_typeof(field_array) != 'array' OR jsonb_array_length(field_array) = 0 THEN
                CONTINUE;
            END IF;
            -- we're not going to honor multiple pubfields
            full_field_slug := field_array ->> 0;
            field_slug := split_part(full_field_slug, ':', 2);
            -- get the current value for this key in config (this becomes the fallback)
            current_value := config_json -> key;
            IF current_value IS NOT NULL AND current_value != '""'::jsonb THEN
                fallback_str := current_value::text;
                -- we use ?? rather than :?, bc it's somewhat likely empty strings are set as values, but we don't want to use those
                interpolation := '<<<$.pub.values.' || field_slug || ' ?? ' || fallback_str || '>>>';
            ELSE
                interpolation := '<<<$.pub.values.' || field_slug || '>>>';
            END IF;
            new_config := jsonb_set(new_config, ARRAY[key], to_jsonb(interpolation));
        END LOOP;
    -- remove pubFields from the config
    new_config := new_config - 'pubFields';
    RETURN new_config;
END;
$$
LANGUAGE plpgsql;

-- apply the migration to all action_instances
UPDATE
    action_instances
SET
    config = migrate_action_instance_pubfields(config)
WHERE
    config -> 'pubFields' IS NOT NULL
    AND config -> 'pubFields' != '{}'::jsonb;

-- remove pubFields from all remaining action_instances (including empty objects)
UPDATE
    action_instances
SET
    config = config - 'pubFields'
WHERE
    config ? 'pubFields';

