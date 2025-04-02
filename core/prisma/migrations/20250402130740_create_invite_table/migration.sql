-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('created', 'pending', 'accepted', 'rejected', 'revoked');

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "communityId" TEXT NOT NULL,
    "communityLevelFormId" TEXT,
    "communityRole" "MemberRole" NOT NULL DEFAULT 'contributor',
    "pubId" TEXT,
    "stageId" TEXT,
    "pubOrStageFormId" TEXT,
    "pubOrStageRole" "MemberRole",
    "message" TEXT,
    "lastSentAt" TIMESTAMP(3),
    "status" "InviteStatus" NOT NULL DEFAULT 'created',
    "invitedByUserId" TEXT,
    "invitedByActionRunId" TEXT,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_communityLevelFormId_fkey" FOREIGN KEY ("communityLevelFormId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_pubOrStageFormId_fkey" FOREIGN KEY ("pubOrStageFormId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedByActionRunId_fkey" FOREIGN KEY ("invitedByActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add check constraints to enforce the type of the invite

ALTER TABLE "invites" ADD CONSTRAINT "invites_email_user_id_check"
CHECK (
    ("email" IS NOT NULL AND "userId" IS NULL) OR
    ("email" IS NULL AND "userId" IS NOT NULL)
);

-- enforce pub/stage constraints
ALTER TABLE "invites" ADD CONSTRAINT "invites_pub_stage_check"
CHECK (
    -- pub case
    ("pubId" IS NOT NULL AND "stageId" IS NULL AND "pubOrStageRole" IS NOT NULL) OR
    -- stage case
    ("pubId" IS NULL AND "stageId" IS NOT NULL AND "pubOrStageRole" IS NOT NULL) OR
    -- neither case
    ("pubId" IS NULL AND "stageId" IS NULL AND "pubOrStageRole" IS NULL)
);

-- enforce that pubOrStageFormId is only set when pub or stage is set
ALTER TABLE "invites" ADD CONSTRAINT "invites_form_id_check"
CHECK (
    ("pubOrStageFormId" IS NOT NULL AND ("pubId" IS NOT NULL OR "stageId" IS NOT NULL)) OR
    "pubOrStageFormId" IS NULL
);

-- enforce invited by constraints
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_check"
CHECK (
    ("invitedByUserId" IS NOT NULL AND "invitedByActionRunId" IS NULL) OR
    ("invitedByUserId" IS NULL AND "invitedByActionRunId" IS NOT NULL)
);

-- enforce last sent at and status constraints
ALTER TABLE "invites" ADD CONSTRAINT "invites_last_sent_status_check"
CHECK (
    ("lastSentAt" IS NOT NULL AND "status" IN ('accepted', 'pending', 'rejected', 'revoked')) OR
    ("lastSentAt" IS NULL AND "status" = 'created')
);