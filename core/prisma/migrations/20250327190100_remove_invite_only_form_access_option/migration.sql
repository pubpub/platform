/*
  Warnings:

  - The values [inviteOnly] on the enum `FormAccessType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FormAccessType_new" AS ENUM ('private', 'public');
ALTER TABLE "forms" ALTER COLUMN "access" DROP DEFAULT;
ALTER TABLE "forms" ALTER COLUMN "access" TYPE "FormAccessType_new" USING ("access"::text::"FormAccessType_new");
ALTER TYPE "FormAccessType" RENAME TO "FormAccessType_old";
ALTER TYPE "FormAccessType_new" RENAME TO "FormAccessType";
DROP TYPE "FormAccessType_old";
ALTER TABLE "forms" ALTER COLUMN "access" SET DEFAULT 'private';
COMMIT;
