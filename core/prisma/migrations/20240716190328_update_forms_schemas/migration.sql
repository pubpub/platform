/*
  Warnings:

  - You are about to drop the `form_inputs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FormAccessType" AS ENUM ('private', 'inviteOnly', 'public');

-- CreateEnum
CREATE TYPE "StructuralFormElement" AS ENUM ('h2', 'h3', 'p', 'hr');

-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('pubfield', 'structural');

-- DropForeignKey
ALTER TABLE "form_inputs" DROP CONSTRAINT "form_inputs_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "form_inputs" DROP CONSTRAINT "form_inputs_formId_fkey";

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "access" "FormAccessType" NOT NULL DEFAULT 'private';

-- DropTable
DROP TABLE "form_inputs";

-- CreateTable
CREATE TABLE "form_elements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type" "ElementType" NOT NULL,
    "fieldId" TEXT,
    "formId" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "element" "StructuralFormElement",
    "content" TEXT,
    "required" BOOLEAN,
    "isSubmit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "form_elements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "pub_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_elements" ADD CONSTRAINT "form_elements_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
