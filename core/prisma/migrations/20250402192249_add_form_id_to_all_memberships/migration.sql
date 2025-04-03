-- AlterTable
ALTER TABLE "community_memberships" ADD COLUMN     "formId" TEXT;

-- AlterTable
ALTER TABLE "pub_memberships" ADD COLUMN     "formId" TEXT;

-- AlterTable
ALTER TABLE "stage_memberships" ADD COLUMN     "formId" TEXT;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_memberships" ADD CONSTRAINT "pub_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_memberships" ADD CONSTRAINT "stage_memberships_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
