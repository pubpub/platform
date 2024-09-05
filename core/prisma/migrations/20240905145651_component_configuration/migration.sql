/*
  Warnings:

  - You are about to drop the column `description` on the `form_elements` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InputComponent" AS ENUM ('textArea', 'textInput', 'datePicker', 'checkbox', 'fileUpload', 'memberSelect', 'confidenceInterval');

-- AlterTable
ALTER TABLE "form_elements" DROP COLUMN "description",
ADD COLUMN     "component" "InputComponent",
ADD COLUMN     "config" JSONB;
