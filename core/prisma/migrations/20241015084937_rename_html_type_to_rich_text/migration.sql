/*
  Warnings:

  - The values [HTML] on the enum `CoreSchemaType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CoreSchemaType_new" AS ENUM ('Boolean', 'DateTime', 'Email', 'FileUpload', 'MemberId', 'Null', 'Number', 'NumericArray', 'String', 'StringArray', 'URL', 'Vector3', 'RichText', 'ContextString');
ALTER TABLE "pub_fields" ALTER COLUMN "schemaName" TYPE "CoreSchemaType_new" USING ("schemaName"::text::"CoreSchemaType_new");
ALTER TYPE "CoreSchemaType" RENAME TO "CoreSchemaType_old";
ALTER TYPE "CoreSchemaType_new" RENAME TO "CoreSchemaType";
DROP TYPE "CoreSchemaType_old";
COMMIT;
