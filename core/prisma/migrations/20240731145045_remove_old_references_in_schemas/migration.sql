UPDATE
    "PubFieldSchema"
SET
    schema = jsonb_set(schema, '{$id}', concat('"unjournal:', split_part(schema ->> '$id', ':', 2), '"')::jsonb)
WHERE
    split_part(schema ->> '$id', ':', 1) = 'pubpub'
RETURNING
    schema;

