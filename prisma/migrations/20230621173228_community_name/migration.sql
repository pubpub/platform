/*
  Warnings:

  - Added the required column `name` to the `communities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "name" TEXT NOT NULL;
