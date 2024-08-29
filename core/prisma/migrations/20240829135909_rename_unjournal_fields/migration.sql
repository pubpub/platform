-- Add "legacy" to fields that don't have schemas and archive
UPDATE
    pub_fields
SET
    name = '(Legacy) ' || name,
    slug = 'legacy-' || slug,
    "isArchived" = true
WHERE
    "schemaName" IS null;

DELETE FROM
    form_elements USING pub_fields
WHERE
    "form_elements"."fieldId" IS NOT null
    AND "pub_fields"."schemaName" IS null;