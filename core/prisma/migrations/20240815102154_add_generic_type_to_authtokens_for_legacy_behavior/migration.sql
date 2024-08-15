-- AlterEnum
ALTER TYPE "AuthTokenType" ADD VALUE 'generic';

-- AlterTable
ALTER TABLE "auth_tokens"
ALTER COLUMN "id"
SET DEFAULT gen_random_uuid ();