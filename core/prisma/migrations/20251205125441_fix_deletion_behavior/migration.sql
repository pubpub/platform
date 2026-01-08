-- DropForeignKey
ALTER TABLE "automations"
    DROP CONSTRAINT "automations_stageId_fkey";

-- AddForeignKey
ALTER TABLE "automations"
    ADD CONSTRAINT "automations_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "action_runs"
    DROP CONSTRAINT "action_runs_actionInstanceId_fkey";

-- set action instance to null instead
ALTER TABLE "action_runs"
    ADD CONSTRAINT "action_runs_actionInstanceId_fkey" FOREIGN KEY ("actionInstanceId") REFERENCES "action_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

