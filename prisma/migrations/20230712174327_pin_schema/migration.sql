/*
  Warnings:

  - Added the required column `user_id` to the `pins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pins" ADD COLUMN     "instance_id" TEXT,
ADD COLUMN     "pub_id" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "workflow_id" TEXT;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pins" ADD CONSTRAINT "pins_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "integration_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
