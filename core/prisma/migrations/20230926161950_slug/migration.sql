/*
  Warnings:

  - You are about to drop the column `slug` on the `pubs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "pubs_slug_key";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "slug";
