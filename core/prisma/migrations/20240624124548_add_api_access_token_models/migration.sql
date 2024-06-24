-- CreateEnum
CREATE TYPE "ApiAccessType" AS ENUM ('read', 'write', 'archive');

-- CreateEnum
CREATE TYPE "ApiAccessTokenScope" AS ENUM ('community', 'pub', 'stage', 'member');

-- CreateTable
CREATE TABLE "api_access_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageLimit" INTEGER,
    "usages" INTEGER NOT NULL DEFAULT 0,

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
CREATE TABLE "api_access_rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "apiAccessTokenId" TEXT NOT NULL,
    "objectType" "ApiAccessTokenScope" NOT NULL,
    "objectId" INTEGER,
    "accessType" "ApiAccessType" NOT NULL,
    "constraints" JSONB,

    CONSTRAINT "api_access_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_access_tokens_token_key" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "token_idx" ON "api_access_tokens"("token");

-- CreateIndex
CREATE INDEX "api_access_rule_idx" ON "api_access_rules"("apiAccessTokenId", "objectType", "objectId");

-- AddForeignKey
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_access_rules" ADD CONSTRAINT "api_access_rules_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
