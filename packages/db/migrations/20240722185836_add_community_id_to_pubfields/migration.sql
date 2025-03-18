BEGIN;
-- Add a column with a temporarily optional communityId
ALTER TABLE "pub_fields" ADD COLUMN     "communityId" TEXT;

-- Rename pubpub:fileUpload to belong to unjournal
UPDATE "pub_fields" SET slug = 'unjournal:fileUpload' WHERE slug = 'pubpub:fileUpload';

-- Drop rows where slug starts with `pubpub` as these core pub fields are deprecated
DELETE FROM "pub_fields" WHERE (slug LIKE 'pubpub:%');

-- Match slugs to determine community IDs. ex: unjournal:url should get unjournal's community ID
UPDATE "pub_fields" SET "communityId" = c.id FROM "communities" c WHERE split_part(pub_fields.slug, ':', 1) = c.slug;

-- Now that communityId is populated (hopefully) make the column required
ALTER TABLE "pub_fields" ALTER COLUMN "communityId" SET NOT NULL;
COMMIT;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
