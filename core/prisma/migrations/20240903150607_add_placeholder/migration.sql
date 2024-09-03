/*
  Warnings:

  - You are about to drop the column `description` on the `form_elements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "form_elements" DROP COLUMN "description",
ADD COLUMN     "placeholder" TEXT;
