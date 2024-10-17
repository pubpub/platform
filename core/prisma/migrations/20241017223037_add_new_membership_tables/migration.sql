/*
  Warnings:

  - You are about to drop the column `role` on the `member_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "member_groups" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "community_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 )
    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pub_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "pubId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 )
    CONSTRAINT "pub_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MemberRole" NOT NULL,
    "stageId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 )
    CONSTRAINT "stage_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_memberships" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "memberGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK ( num_nonnulls("userId", "memberGroupId") = 1 )
    CONSTRAINT "form_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_userId_key" ON "community_memberships"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_key" ON "community_memberships"("communityId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_userId_key" ON "pub_memberships"("pubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_key" ON "pub_memberships"("pubId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_userId_key" ON "stage_memberships"("stageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_key" ON "stage_memberships"("stageId", "memberGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_userId_key" ON "form_memberships"("formId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "form_memberships_formId_memberGroupId_key" ON "form_memberships"("formId", "memberGroupId");

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "member_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
