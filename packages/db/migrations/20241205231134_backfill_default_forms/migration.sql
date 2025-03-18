WITH "components" AS (
    SELECT
        "c".*
    FROM (
        VALUES 
        ('Boolean'::"CoreSchemaType", 'checkbox'::"InputComponent"),
        ('String'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('DateTime'::"CoreSchemaType", 'datePicker'::"InputComponent"),
        ('Number'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('NumericArray'::"CoreSchemaType", 'multivalueInput'::"InputComponent"),
        ('StringArray'::"CoreSchemaType", 'multivalueInput'::"InputComponent"),
        ('Email'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('FileUpload'::"CoreSchemaType", 'fileUpload'::"InputComponent"),
        ('URL'::"CoreSchemaType", 'textInput'::"InputComponent"),
        ('MemberId'::"CoreSchemaType", 'memberSelect'::"InputComponent"),
        ('Vector3'::"CoreSchemaType", 'confidenceInterval'::"InputComponent"),
        ('Null'::"CoreSchemaType", NULL::"InputComponent"),
        ('RichText'::"CoreSchemaType", 'richText'::"InputComponent")
    ) AS c("schema", "component")
),
"form" AS (
    INSERT INTO
        "forms"(
            "name",
            "pubTypeId",
            "slug",
            "communityId",
            "isDefault"
        )
    SELECT
        "pub_types"."name" || ' Editor (Default)',
        "pub_types"."id",
        -- Rough equivalent to our slugify js function, adapted from https://gist.github.com/abn/779166b0c766ce67351c588489831852
        trim(
            BOTH '-'
            FROM
                regexp_replace(
                    lower(trim("pub_types"."name")),
                    '[^a-z0-9\\-_]+',
                    '-',
                    'gi'
                )
        ) || '-default-editor',
        "pub_types"."communityId",
        TRUE
    FROM "pub_types"
    ON CONFLICT DO NOTHING
    RETURNING 
        "forms"."slug",
        "forms"."id",
        "forms"."pubTypeId"
),
"title_element" AS (
    INSERT INTO
        "form_elements"("formId", "type", "content", "order", "element")
    SELECT
        "form"."id",
        'structural',
        '# :value{field="title"}',
        0,
        'p'
    FROM
        "form"
)
INSERT INTO
    "form_elements"(
        "fieldId",
        "formId",
        "label",
        "type",
        "order",
        "component"
    )
SELECT
    "pub_fields"."id",
    "form"."id" AS "formId",
    "pub_fields"."name" AS "label",
    'pubfield' AS "type",
    ROW_NUMBER() OVER (PARTITION BY "form"."id") + 1 AS "order",
    "components"."component"
FROM
    "form"
    INNER JOIN "_PubFieldToPubType" ON "_PubFieldToPubType"."B" = "form"."pubTypeId"
    INNER JOIN "pub_fields" ON "pub_fields"."id" = "_PubFieldToPubType"."A"
    INNER JOIN "components" ON "components"."schema" = "pub_fields"."schemaName";