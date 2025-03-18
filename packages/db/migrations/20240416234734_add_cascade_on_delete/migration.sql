-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_community_id_fkey";

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
