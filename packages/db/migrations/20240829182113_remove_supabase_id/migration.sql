/*
  Warnings:

  - You are about to drop the column `supabaseId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_supabaseId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "supabaseId";
