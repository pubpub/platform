-- CreateEnum
CREATE TYPE "ApiAccessType" AS ENUM ('read', 'write', 'archive');

-- CreateEnum
CREATE TYPE "ApiAccessScope" AS ENUM ('community', 'pub', 'stage', 'member', 'pubType');

-- CreateTable
CREATE TABLE "api_access_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "communityId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_access_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "accessTokenId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,

    CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_access_permissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "apiAccessTokenId" TEXT NOT NULL,
    "scope" "ApiAccessScope" NOT NULL,
    "accessType" "ApiAccessType" NOT NULL,
    "constraints" JSONB,

    CONSTRAINT "api_access_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_access_tokens_token_key" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "token_idx" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "api_access_permissions_idx" ON "api_access_permissions"("apiAccessTokenId", "scope", "accessType");

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_permissions" ADD CONSTRAINT "api_access_permissions_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
