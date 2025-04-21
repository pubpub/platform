/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `pubs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pubs" DROP CONSTRAINT "pubs_assigneeId_fkey";

-- AlterTable
ALTER TABLE "pubs" DROP COLUMN "assigneeId";
