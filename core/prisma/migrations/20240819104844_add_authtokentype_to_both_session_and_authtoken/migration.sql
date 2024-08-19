-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('generic', 'passwordReset', 'signup', 'publicInvite', 'verifyEmail');

-- AlterTable
ALTER TABLE "auth_tokens" ADD COLUMN     "type" "AuthTokenType" NOT NULL DEFAULT 'generic',
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "type" "AuthTokenType" NOT NULL DEFAULT 'generic';
