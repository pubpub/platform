/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "name" SET DEFAULT '',
  ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "orcid" TEXT;

ALTER TABLE "users" RENAME COLUMN "name" TO "firstName";
