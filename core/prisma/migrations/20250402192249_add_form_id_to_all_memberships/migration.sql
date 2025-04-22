-- AlterTable
ALTER TABLE "community_memberships"
ADD COLUMN "formId" TEXT;

-- AlterTable
ALTER TABLE "pub_memberships"
ADD COLUMN "formId" TEXT;

-- AlterTable
ALTER TABLE "stage_memberships"
ADD COLUMN "formId" TEXT;

-- AddForeignKey
ALTER TABLE "community_memberships"
ADD CONSTRAINT "community_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships"
ADD CONSTRAINT "pub_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships"
ADD CONSTRAINT "stage_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only allow formId to be set for contributor memberships
ALTER TABLE "community_memberships"
ADD CONSTRAINT "community_memberships_contributor_formId_check" CHECK (
    "role" = 'contributor'::"MemberRole"
    OR "formId" IS NULL
);

ALTER TABLE "stage_memberships"
ADD CONSTRAINT "stage_memberships_contributor_formId_check" CHECK (
    "role" = 'contributor'::"MemberRole"
    OR "formId" IS NULL
);

ALTER TABLE "pub_memberships"
ADD CONSTRAINT "pub_memberships_contributor_formId_check" CHECK (
    "role" = 'contributor'::"MemberRole"
    OR "formId" IS NULL
);

/*
Warnings:

- A unique constraint covering the columns `[communityId,userId,formId]` on the table `community_memberships` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[communityId,memberGroupId,formId]` on the table `community_memberships` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[pubId,userId,formId]` on the table `pub_memberships` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[pubId,memberGroupId,formId]` on the table `pub_memberships` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[stageId,userId,formId]` on the table `stage_memberships` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[stageId,memberGroupId,formId]` on the table `stage_memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "community_memberships_communityId_memberGroupId_key";

-- DropIndex
DROP INDEX "community_memberships_communityId_userId_key";

-- DropIndex
DROP INDEX "pub_memberships_pubId_memberGroupId_key";

-- DropIndex
DROP INDEX "pub_memberships_pubId_userId_key";

-- DropIndex
DROP INDEX "stage_memberships_stageId_memberGroupId_key";

-- DropIndex
DROP INDEX "stage_memberships_stageId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_userId_formId_key" ON "community_memberships" ("communityId", "userId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "community_memberships_communityId_userId_key" ON "community_memberships" ("communityId", "userId")
WHERE
    "formId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_formId_key" ON "community_memberships" ("communityId", "memberGroupId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "community_memberships_communityId_memberGroupId_key" ON "community_memberships" ("communityId", "memberGroupId")
WHERE
    "formId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_userId_formId_key" ON "pub_memberships" ("pubId", "userId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_memberships_pubId_userId_key" ON "pub_memberships" ("pubId", "userId")
WHERE
    "formId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_formId_key" ON "pub_memberships" ("pubId", "memberGroupId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "pub_memberships_pubId_memberGroupId_key" ON "pub_memberships" ("pubId", "memberGroupId")
WHERE
    "formId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_userId_formId_key" ON "stage_memberships" ("stageId", "userId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "stage_memberships_stageId_userId_key" ON "stage_memberships" ("stageId", "userId")
WHERE
    "formId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_formId_key" ON "stage_memberships" ("stageId", "memberGroupId", "formId")
WHERE
    "formId" IS NOT NULL;

CREATE UNIQUE INDEX "stage_memberships_stageId_memberGroupId_key" ON "stage_memberships" ("stageId", "memberGroupId")
WHERE
    "formId" IS NULL;
