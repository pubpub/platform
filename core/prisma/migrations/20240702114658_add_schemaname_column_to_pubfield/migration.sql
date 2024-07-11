-- CreateEnum
CREATE TYPE "CoreSchemaType" AS ENUM ('String', 'Boolean', 'Vector3', 'DateTime', 'Email', 'URL', 'UserId', 'FileUpload');

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "schemaName" "CoreSchemaType";
