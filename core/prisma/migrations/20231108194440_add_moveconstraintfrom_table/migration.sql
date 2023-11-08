-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP DEFAULT;

-- CreateTable
CREATE TABLE "move_constraint_from" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_constraint_from_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "move_constraint_from" ADD CONSTRAINT "move_constraint_from_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_constraint_from" ADD CONSTRAINT "move_constraint_from_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
