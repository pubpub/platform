-- CreateTable
CREATE TABLE "action_config_defaults" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "communityId" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_config_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex

ALTER TABLE "action_config_defaults" ADD CONSTRAINT "action_config_defaults_communityId_action_key" UNIQUE ("communityId", "action");

-- AddForeignKey
ALTER TABLE "action_config_defaults" ADD CONSTRAINT "action_config_defaults_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
