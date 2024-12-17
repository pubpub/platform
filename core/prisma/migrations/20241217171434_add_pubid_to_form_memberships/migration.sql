-- AlterTable
ALTER TABLE "form_memberships" ADD COLUMN     "pubId" TEXT;

-- AddForeignKey
ALTER TABLE "form_memberships" ADD CONSTRAINT "form_memberships_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
