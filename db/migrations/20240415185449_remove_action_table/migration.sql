/*
  Warnings:

  - You are about to drop the column `action_id` on the `action_instances` table. All the data in the column will be lost.
  - You are about to drop the `_ActionToPubField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `action` to the `action_instances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Action" AS ENUM ('log', 'pdf', 'email');

-- DropForeignKey
ALTER TABLE "_ActionToPubField" DROP CONSTRAINT "_ActionToPubField_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActionToPubField" DROP CONSTRAINT "_ActionToPubField_B_fkey";

-- DropForeignKey
ALTER TABLE "action_instances" DROP CONSTRAINT "action_instances_action_id_fkey";

-- AlterTable
ALTER TABLE "action_instances" DROP COLUMN "action_id",
ADD COLUMN     "action" "Action" NOT NULL;

-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "actions" "Action"[];

-- DropTable
DROP TABLE "_ActionToPubField";

-- DropTable
DROP TABLE "actions";
