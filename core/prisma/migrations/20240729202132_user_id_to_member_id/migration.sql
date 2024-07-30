/*
  Warnings:

  - The values [UserId] on the enum `CoreSchemaType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CoreSchemaType_new" AS ENUM ('String', 'Boolean', 'Vector3', 'DateTime', 'Email', 'URL', 'MemberId', 'FileUpload');
ALTER TABLE "pub_fields" ALTER COLUMN "schemaName" TYPE "CoreSchemaType_new" USING ("schemaName"::text::"CoreSchemaType_new");
ALTER TYPE "CoreSchemaType" RENAME TO "CoreSchemaType_old";
ALTER TYPE "CoreSchemaType_new" RENAME TO "CoreSchemaType";
DROP TYPE "CoreSchemaType_old";
COMMIT;
