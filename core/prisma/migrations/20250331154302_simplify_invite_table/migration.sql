/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `sendAttempts` on the `invites` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `invites` table. All the data in the column will be lost.
  - The `status` column on the `invites` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "acceptedAt",
DROP COLUMN "revokedAt",
DROP COLUMN "sendAttempts",
DROP COLUMN "sentAt",
DROP COLUMN "status",
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'pending';
