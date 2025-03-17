/*
  Warnings:

  - Added the required column `pub_id` to the `metadata` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `metadata` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `community_id` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fields` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `pub_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_id` to the `pubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pub_type_id` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "metadata" ADD COLUMN     "pub_id" TEXT NOT NULL,
DROP COLUMN "value",
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "pub_types" ADD COLUMN     "community_id" TEXT NOT NULL,
ADD COLUMN     "fields" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "pub_type_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pubs" ADD CONSTRAINT "pubs_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_types" ADD CONSTRAINT "pub_types_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata" ADD CONSTRAINT "metadata_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
