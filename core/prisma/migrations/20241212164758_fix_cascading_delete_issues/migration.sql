-- DropForeignKey
ALTER TABLE "api_access_logs" DROP CONSTRAINT "api_access_logs_accessTokenId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_permissions" DROP CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_communityId_fkey";

-- DropForeignKey
ALTER TABLE "api_access_tokens" DROP CONSTRAINT "api_access_tokens_issuedById_fkey";

-- AlterTable
ALTER TABLE "api_access_logs" ALTER COLUMN "accessTokenId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "api_access_tokens" ALTER COLUMN "issuedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_permissions" ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
