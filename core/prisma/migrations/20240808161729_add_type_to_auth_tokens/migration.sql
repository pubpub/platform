-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('magicLink', 'passwordReset', 'signup');

-- AlterTable
ALTER TABLE "auth_tokens" ADD COLUMN     "type" "AuthTokenType" NOT NULL DEFAULT 'magicLink';
