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

-- Set default form components
UPDATE "form_elements" SET "component" = 'checkbox'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Boolean'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'String'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'datePicker'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'DateTime'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Email'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'fileUpload'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'FileUpload'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'textInput'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'URL'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'memberSelect'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'MemberId'::"CoreSchemaType";
UPDATE "form_elements" SET "component" = 'confidenceInterval'::"InputComponent" FROM "pub_fields" WHERE "form_elements"."fieldId" = "pub_fields"."id" AND "pub_fields"."schemaName" = 'Vector3'::"CoreSchemaType";