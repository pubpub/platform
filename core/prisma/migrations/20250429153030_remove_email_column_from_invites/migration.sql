/*
  Warnings:

  - You are about to drop the column `email` on the `invites` table. All the data in the column will be lost.
  - Made the column `userId` on table `invites` required. This step will fail if there are existing NULL values in that column.

*/

-- remove all invites that have a user
DELETE FROM "invites" WHERE "userId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_userId_fkey";

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "email",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isProvisional" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
