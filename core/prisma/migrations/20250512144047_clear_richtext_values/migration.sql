UPDATE "pub_values" SET "value" = '"<p></p>"', "lastModifiedBy" = CONCAT('system', '|', FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)) WHERE "fieldId" IN (
    SELECT "id" FROM "pub_fields" WHERE "schemaName" = 'RichText'::"CoreSchemaType"
);