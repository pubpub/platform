/*
  Warnings:

  - You are about to drop the column `parentId` on the `pubs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_parentId_fkey";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "parentId";
