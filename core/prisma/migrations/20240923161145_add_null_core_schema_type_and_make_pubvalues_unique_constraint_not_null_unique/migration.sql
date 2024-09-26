-- AlterEnum
ALTER TYPE "CoreSchemaType" ADD VALUE 'Null';

-- Alter the unique constraint so that Nulls are not distinct
-- We want to be able to still have a unique constraint on just pubId and fieldId if there is a null relatedPubId
BEGIN;
DROP INDEX "pub_values_pubId_relatedPubId_fieldId_key";
CREATE UNIQUE INDEX "pub_values_pubId_relatedPubId_fieldId_key" ON "pub_values"("pubId", "relatedPubId", "fieldId")
WHERE "relatedPubId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_values_pubId_fieldId_key" ON "pub_values"("pubId", "fieldId")
WHERE "relatedPubId" IS NULL;
COMMIT;
