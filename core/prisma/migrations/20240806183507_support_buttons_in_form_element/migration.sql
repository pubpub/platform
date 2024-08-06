/*
  Warnings:

  - You are about to drop the column `isSubmit` on the `form_elements` table. All the data in the column will be lost.

*/

-- AlterEnum
ALTER TYPE "ElementType" ADD VALUE 'button';

-- AlterTable
ALTER TABLE "form_elements" ADD COLUMN     "stageId" TEXT,
ALTER COLUMN "order" DROP NOT NULL;
ALTER TABLE "form_elements" DROP COLUMN "isSubmit";

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
