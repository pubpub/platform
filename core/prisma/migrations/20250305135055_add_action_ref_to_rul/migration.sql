-- AlterTable
ALTER TABLE "rules" ADD COLUMN     "watchedActionId" TEXT;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_watchedActionId_fkey" FOREIGN KEY ("watchedActionId") REFERENCES "action_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "rules_actionInstanceId_event_key";

-- unique index for action chaining events
CREATE UNIQUE INDEX "unique_action_chaining_events" ON "rules" ("actionInstanceId", "event", "watchedActionId") WHERE "watchedActionId" IS NOT NULL;

-- unique index for regular events
CREATE UNIQUE INDEX "unique_regular_events" ON "rules" ("actionInstanceId", "event") WHERE "watchedActionId" IS NULL;