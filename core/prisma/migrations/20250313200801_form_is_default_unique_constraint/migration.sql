/*
  Warnings:

  - A unique constraint covering the columns `[isDefault,pubTypeId]` on the table `forms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "forms_isDefault_pubTypeId_key" ON "forms"("isDefault", "pubTypeId") WHERE "forms"."isDefault" is true;
