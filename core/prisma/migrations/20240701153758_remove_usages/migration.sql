/*
  Warnings:

  - You are about to drop the column `usageLimit` on the `api_access_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usages` on the `api_access_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_access_tokens" DROP COLUMN "usageLimit",
DROP COLUMN "usages";
