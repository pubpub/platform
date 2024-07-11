-- CreateTable
CREATE TABLE "action_instances" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_instances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_instances" ADD CONSTRAINT "action_instances_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
