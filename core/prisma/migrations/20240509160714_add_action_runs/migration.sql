-- CreateEnum
CREATE TYPE "ActionRunStatus" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "ActionRun" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action_instance_id" TEXT NOT NULL,
    "config" JSONB,
    "event" "Event",
    "params" JSONB,
    "status" "ActionRunStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionRun" ADD CONSTRAINT "ActionRun_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
