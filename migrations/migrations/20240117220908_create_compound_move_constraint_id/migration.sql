/*
  Warnings:

  - The primary key for the `move_constraint` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `move_constraint` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "move_constraint_stage_id_destination_id_key";

-- AlterTable
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("stage_id", "destination_id");
