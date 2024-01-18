/*
  Warnings:

  - A unique constraint covering the columns `[stage_id,destination_id]` on the table `move_constraint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "move_constraint_stage_id_destination_id_key" ON "move_constraint"("stage_id", "destination_id");
