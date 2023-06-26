/*
  Warnings:

  - Added the required column `workflow_id` to the `stages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "workflow_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "move_constraint" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_constraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_claim" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "pub_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_move" (
    "id" TEXT NOT NULL,
    "source_stage_id" TEXT NOT NULL,
    "destination_stage_id" TEXT NOT NULL,
    "pub_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PubToStage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PubToStage_AB_unique" ON "_PubToStage"("A", "B");

-- CreateIndex
CREATE INDEX "_PubToStage_B_index" ON "_PubToStage"("B");

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint" ADD CONSTRAINT "move_constraint_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_claim" ADD CONSTRAINT "action_claim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_source_stage_id_fkey" FOREIGN KEY ("source_stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_destination_stage_id_fkey" FOREIGN KEY ("destination_stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_move" ADD CONSTRAINT "action_move_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubToStage" ADD CONSTRAINT "_PubToStage_A_fkey" FOREIGN KEY ("A") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PubToStage" ADD CONSTRAINT "_PubToStage_B_fkey" FOREIGN KEY ("B") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
