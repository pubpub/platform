-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "integration_id" TEXT;

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
