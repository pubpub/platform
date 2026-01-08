-- function to recursively build nested condition blocks with their items
CREATE OR REPLACE FUNCTION get_condition_block_items(_block_id text)
    RETURNS jsonb
    LANGUAGE sql
    STABLE PARALLEL SAFE
    AS $func$
    SELECT
        COALESCE(jsonb_agg(sub ORDER BY(sub ->> 'rank')
                COLLATE "C"), '[]'::jsonb)
    FROM(
        -- get conditions
        SELECT
            to_jsonb(ac.*) || jsonb_build_object('kind', 'condition') AS sub
        FROM
            automation_conditions ac
        WHERE
            ac."automationConditionBlockId" = _block_id
        UNION ALL
        -- get nested blocks with their items recursively
        SELECT
            to_jsonb(acb.*) || jsonb_build_object('kind', 'block', 'items', get_condition_block_items(acb.id)) AS sub
        FROM
            automation_condition_blocks acb
        WHERE
            acb."automationConditionBlockId" = _block_id) items
$func$;

