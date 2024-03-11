-- CreateTable
CREATE TABLE "pending_members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pending_members" ADD CONSTRAINT "pending_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
