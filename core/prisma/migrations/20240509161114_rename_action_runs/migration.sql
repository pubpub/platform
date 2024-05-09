/*
  Warnings:

  - You are about to drop the `ActionRun` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActionRun" DROP CONSTRAINT "ActionRun_action_instance_id_fkey";

-- DropTable
DROP TABLE "ActionRun";

-- CreateTable
CREATE TABLE "action_runs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action_instance_id" TEXT NOT NULL,
    "config" JSONB,
    "event" "Event",
    "params" JSONB,
    "status" "ActionRunStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
