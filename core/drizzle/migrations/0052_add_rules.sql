-- CreateEnum
CREATE TYPE "Event" AS ENUM ('pubEnteredStage', 'pubLeftStage');

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "event" "Event" NOT NULL,
    "action_instance_id" TEXT NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_action_instance_id_event_key" ON "rules"("action_instance_id", "event");

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_action_instance_id_fkey" FOREIGN KEY ("action_instance_id") REFERENCES "action_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
