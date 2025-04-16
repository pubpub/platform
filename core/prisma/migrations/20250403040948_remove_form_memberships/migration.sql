/*
Warnings:

- You are about to drop the `form_memberships` table. If the table is not empty, all the data it contains will be lost.

*/
-- Replace form memberships for specific pubs with pub contributorships
INSERT INTO
  "pub_memberships" (
    "userId",
    "memberGroupId",
    "pubId",
    "role",
    "formId",
    "createdAt",
    "updatedAt"
  ) (
    SELECT
      "userId",
      "memberGroupId",
      "pubId",
      'contributor'::"MemberRole",
      "formId",
      "createdAt",
      "updatedAt"
    FROM
      "form_memberships"
    WHERE
      "pubId" IS NOT NULL
  )
ON CONFLICT DO NOTHING;

-- Replace form memberships without a pub with community contributorships
INSERT INTO
  "community_memberships" (
    "userId",
    "memberGroupId",
    "communityId",
    "role",
    "formId",
    "createdAt",
    "updatedAt"
  ) (
    SELECT
      "form_memberships"."userId",
      "form_memberships"."memberGroupId",
      "forms"."communityId",
      'contributor'::"MemberRole",
      "form_memberships"."formId",
      "form_memberships"."createdAt",
      "form_memberships"."updatedAt"
    FROM
      "form_memberships"
      JOIN "forms" ON "forms"."id" = "form_memberships"."formId"
    WHERE
      "pubId" IS NULL
  )
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "form_memberships"
DROP CONSTRAINT "form_memberships_formId_fkey";

-- DropForeignKey
ALTER TABLE "form_memberships"
DROP CONSTRAINT "form_memberships_memberGroupId_fkey";

-- DropForeignKey
ALTER TABLE "form_memberships"
DROP CONSTRAINT "form_memberships_pubId_fkey";

-- DropForeignKey
ALTER TABLE "form_memberships"
DROP CONSTRAINT "form_memberships_userId_fkey";

-- DropTable
DROP TABLE "form_memberships";


/**
  Warnings:

  - The values [form] on the enum `MembershipType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MembershipType_new" AS ENUM ('community', 'stage', 'pub');
ALTER TABLE "membership_capabilities" ALTER COLUMN "type" TYPE "MembershipType_new" USING ("type"::text::"MembershipType_new");
ALTER TYPE "MembershipType" RENAME TO "MembershipType_old";
ALTER TYPE "MembershipType_new" RENAME TO "MembershipType";
DROP TYPE "MembershipType_old";
COMMIT;
