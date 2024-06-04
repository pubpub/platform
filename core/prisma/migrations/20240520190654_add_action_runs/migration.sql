-- CreateEnum
CREATE TYPE "ActionRunStatus" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "action_runs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action_instance_id" TEXT,
    "pub_id" TEXT,
    "config" JSONB,
    "event" "Event",
    "params" JSONB,
    "status" "ActionRunStatus" NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
