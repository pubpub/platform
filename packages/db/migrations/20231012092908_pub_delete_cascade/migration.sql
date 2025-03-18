-- DropForeignKey
ALTER TABLE "pub_values" DROP CONSTRAINT "pub_values_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
