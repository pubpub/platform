-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "sourceActionRunId" TEXT;

-- AddForeignKey
ALTER TABLE "action_runs" ADD CONSTRAINT "action_runs_sourceActionRunId_fkey" FOREIGN KEY ("sourceActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
