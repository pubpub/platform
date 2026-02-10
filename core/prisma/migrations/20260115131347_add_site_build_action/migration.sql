-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'buildSite';

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_inputPubId_fkey" FOREIGN KEY ("inputPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
