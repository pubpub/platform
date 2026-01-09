-- DropForeignKey
ALTER TABLE "pub_fields" DROP CONSTRAINT "pub_fields_communityId_fkey";

-- DropForeignKey
ALTER TABLE "pub_types" DROP CONSTRAINT "pub_types_communityId_fkey";

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_communityId_fkey";

-- DropForeignKey
ALTER TABLE "stages" DROP CONSTRAINT "stages_communityId_fkey";

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_types" ADD CONSTRAINT "pub_types_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
