-- AlterTable
ALTER TABLE "_PubFieldToPubType" ADD COLUMN     "isTitle" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "_PubFieldToPubType_AB_unique" RENAME TO "_PubFieldToPubType_A_B_key";

-- Create a unique index when isTitle=true 
-- This is done manually because prisma doesn't currently support defining unique constraints this way in the schema file
CREATE UNIQUE INDEX unique_pubType_isTitle on "_PubFieldToPubType" ("B") where "isTitle" is true;


-- Migrate so that all pub types will have some sort of title field
BEGIN;

-- First try to match on if there's an existing 'title' or 'name' field and set that field to isTitle=true
WITH FirstMatchingPubField AS (
    SELECT
      "_PubFieldToPubType"."A" as "pubfield",
      "_PubFieldToPubType"."B" as "pubtype",
      pub_fields.slug,
      ROW_NUMBER() OVER (PARTITION BY "_PubFieldToPubType"."B" ORDER BY pub_fields."createdAt" ASC) AS row_num
    FROM
      "_PubFieldToPubType"
      JOIN pub_fields ON "_PubFieldToPubType"."A" = pub_fields.id 
    WHERE
      (pub_fields."schemaName" = 'String' OR pub_fields."schemaName" = 'RichText' OR pub_fields."schemaName" = 'Number')
      AND (
          pub_fields.name ILIKE '%title%'
          OR pub_fields.name ILIKE '%name%'
      )
)
UPDATE "_PubFieldToPubType"
SET "isTitle" = true 
FROM FirstMatchingPubField
WHERE 
  "_PubFieldToPubType"."A" = FirstMatchingPubField.pubfield
  AND "_PubFieldToPubType"."B" = FirstMatchingPubField.pubtype 
  AND FirstMatchingPubField.row_num = 1;

-- If there's no match, just set the first field that is string, rich text, or number
WITH FirstAvailablePubField AS (
    SELECT
      "_PubFieldToPubType"."A" as "pubfield",
      "_PubFieldToPubType"."B" as "pubtype",
      pub_fields."slug",
      pub_types.name,
      ROW_NUMBER() OVER (PARTITION BY "_PubFieldToPubType"."B" ORDER BY pub_fields."createdAt" ASC) AS row_num
    FROM
      "_PubFieldToPubType"
      JOIN pub_fields ON "_PubFieldToPubType"."A" = pub_fields.id 
      JOIN pub_types ON "_PubFieldToPubType"."B" = pub_types.id
    WHERE
      (pub_fields."schemaName" = 'String' OR pub_fields."schemaName" = 'RichText' OR pub_fields."schemaName" = 'Number')
      AND NOT EXISTS (
        SELECT 1
        FROM "_PubFieldToPubType" AS "sub"
        WHERE "sub"."B" = "_PubFieldToPubType"."B"
        AND "sub"."isTitle" = true
      )
)
UPDATE "_PubFieldToPubType"
SET "isTitle" = true 
FROM FirstAvailablePubField
WHERE 
  "_PubFieldToPubType"."A" = FirstAvailablePubField.pubfield
  AND "_PubFieldToPubType"."B" = FirstAvailablePubField.pubtype 
  AND FirstAvailablePubField.row_num = 1;

INSERT INTO "_PubFieldToPubType" ("A", "B", "isTitle")
SELECT
  "newField"."id" AS "A",
  pub_types.id AS "B",
  true AS isTitle,
  pub_types.name,
  "newField".slug
FROM
  pub_types
  LEFT JOIN LATERAL (
    SELECT 
      id, slug 
    FROM pub_fields 
    WHERE (pub_fields."schemaName" = 'String' OR pub_fields."schemaName" = 'RichText' OR pub_fields."schemaName" = 'Number')
      AND (
          pub_fields.name ILIKE '%title%'
          OR pub_fields.name ILIKE '%name%'
      )
    AND pub_fields."communityId" = pub_types."communityId"
    LIMIT 1
  ) AS "newField" ON true
WHERE
  NOT EXISTS (
    SELECT 1
    FROM "_PubFieldToPubType"
    WHERE "_PubFieldToPubType"."B" = pub_types.id
    AND "_PubFieldToPubType"."isTitle" = true
  )
  AND "newField".id IS NOT NULL;

END;