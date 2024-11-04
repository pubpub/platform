/*
  Warnings:

  - A unique constraint covering the columns `[pubId,relatedPubId,fieldId]` on the table `pub_values` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "isRelation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pub_values" ADD COLUMN     "relatedPubId" TEXT,
ALTER COLUMN "value" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_values_pubId_relatedPubId_fieldId_key" ON "pub_values"("pubId", "relatedPubId", "fieldId");

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_relatedPubId_fkey" FOREIGN KEY ("relatedPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
