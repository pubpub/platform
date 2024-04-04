-- DropForeignKey
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "move_constraint" DROP CONSTRAINT "move_constraint_stage_id_fkey";

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
