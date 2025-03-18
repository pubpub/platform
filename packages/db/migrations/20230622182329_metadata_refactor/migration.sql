/*
  Warnings:

  - You are about to drop the column `fields` on the `pub_types` table. All the data in the column will be lost.
  - You are about to drop the `metadata` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `metadataBlob` to the `pubs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "metadata" DROP CONSTRAINT "metadata_pub_id_fkey";

-- AlterTable
ALTER TABLE "pub_types" DROP COLUMN "fields";

-- AlterTable
ALTER TABLE "pubs" ADD COLUMN     "metadataBlob" JSONB NOT NULL;

-- DropTable
DROP TABLE "metadata";

-- CreateTable
CREATE TABLE "metadata_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pub_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_values" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "pub_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_values_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metadata_fields" ADD CONSTRAINT "metadata_fields_pub_type_id_fkey" FOREIGN KEY ("pub_type_id") REFERENCES "pub_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "metadata_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
