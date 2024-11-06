-- AlterTable
ALTER TABLE "_PubFieldToPubType" ADD COLUMN     "isTitle" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "_PubFieldToPubType_AB_unique" RENAME TO "_PubFieldToPubType_A_B_key";

-- Create a unique index when isTitle=true 
-- This is done manually because prisma doesn't currently support defining unique constraints this way in the schema file
CREATE UNIQUE INDEX unique_pubType_isTitle on "_PubFieldToPubType" ("B") where "isTitle" is true;

-- Try to match on if there's an existing 'title' or 'name' field and set that field to isTitle=true
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
      (pub_fields."schemaName" = 'String' OR pub_fields."schemaName" = 'Email' OR pub_fields."schemaName" = 'URL')
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