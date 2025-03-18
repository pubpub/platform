-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AlterTable
ALTER TABLE "pubs" ALTER COLUMN "parent_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
