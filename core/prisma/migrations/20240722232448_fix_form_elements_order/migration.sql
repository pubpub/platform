/*
  Warnings:

  - A unique constraint covering the columns `[fieldId,formId]` on the table `form_elements` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order,formId]` on the table `form_elements` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "form_elements" ALTER COLUMN "order" DROP DEFAULT;
DROP SEQUENCE "form_elements_order_seq";

-- CreateIndex
CREATE UNIQUE INDEX "form_elements_fieldId_formId_key" ON "form_elements"("fieldId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "form_elements_order_formId_key" ON "form_elements"("order", "formId");
