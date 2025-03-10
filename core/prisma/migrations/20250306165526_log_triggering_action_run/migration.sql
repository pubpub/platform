-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "triggeringActionRunId" TEXT;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_triggeringActionRunId_fkey" FOREIGN KEY ("triggeringActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
