/*
  Warnings:

  - You are about to drop the column `metadataBlob` on the `pubs` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `pubs` table. All the data in the column will be lost.
  - You are about to drop the `metadata_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `metadata_values` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "metadata_fields" DROP CONSTRAINT "metadata_fields_pub_type_id_fkey";

-- DropForeignKey
ALTER TABLE "metadata_values" DROP CONSTRAINT "metadata_values_field_id_fkey";

-- DropForeignKey
ALTER TABLE "metadata_values" DROP CONSTRAINT "metadata_values_pub_id_fkey";

-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parent_id_fkey";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "metadataBlob",
DROP COLUMN "parent_id",
ADD COLUMN     "valuesBlob" JSONB;

-- DropTable
DROP TABLE "metadata_fields";

-- DropTable
DROP TABLE "metadata_values";

-- CreateTable
CREATE TABLE "pub_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pub_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pub_values" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "pub_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pub_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PubFieldToPubType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PubFieldToPubType_AB_unique" ON "_PubFieldToPubType"("A", "B");

-- CreateIndex
CREATE INDEX "_PubFieldToPubType_B_index" ON "_PubFieldToPubType"("B");

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "pub_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubFieldToPubType" ADD CONSTRAINT "_PubFieldToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
