/*
  Warnings:

  - A unique constraint covering the columns `[pubId,fieldId,connectedPubId]` on the table `pub_values` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CoreSchemaType" ADD VALUE 'Connection';

-- AlterEnum
ALTER TYPE "InputComponent" ADD VALUE 'connectionSelect';

-- AlterTable
ALTER TABLE "pub_values" ADD COLUMN     "connectedPubId" TEXT,
ALTER COLUMN "value" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_values_pubId_fieldId_connectedPubId_key" ON "pub_values"("pubId", "fieldId", "connectedPubId");

-- AddForeignKey
ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_connectedPubId_fkey" FOREIGN KEY ("connectedPubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
