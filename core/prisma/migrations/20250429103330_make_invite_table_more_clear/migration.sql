-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('created', 'pending', 'accepted', 'completed', 'rejected', 'revoked');

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
    "communityRole" "MemberRole" NOT NULL DEFAULT 'contributor',
    "pubId" TEXT,
    "pubRole" "MemberRole",
    "stageId" TEXT,
    "stageRole" "MemberRole",
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
ALTER TABLE "invites" ADD CONSTRAINT "invites_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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


-- enforce invited by constraints
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_check"
CHECK (
    ("invitedByUserId" IS NOT NULL AND "invitedByActionRunId" IS NULL) OR
    ("invitedByUserId" IS NULL AND "invitedByActionRunId" IS NOT NULL)
);

-- enforce last sent at and status constraints
ALTER TABLE "invites" ADD CONSTRAINT "invites_last_sent_status_check"
CHECK (
    ("lastSentAt" IS NOT NULL AND "status" IN ('accepted', 'pending', 'rejected', 'revoked', 'completed')) OR
    ("lastSentAt" IS NULL AND "status" = 'created')
);

-- CreateTable
CREATE TABLE "invite_forms" (
    "inviteId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "MembershipType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_forms_pkey" PRIMARY KEY ("inviteId","formId","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_forms_inviteId_formId_type_key" ON "invite_forms"("inviteId", "formId", "type");

-- AddForeignKey
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint
-- function because you cannot use subqueries in check constraints
CREATE OR REPLACE FUNCTION check_invite_has_pub_or_stage(type "MembershipType", invite_id TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN CASE 
    WHEN "type" = 'pub'::"MembershipType" THEN EXISTS (
      SELECT 1 FROM "invites" 
      WHERE "invites"."id" = invite_id 
      AND "invites"."pubId" IS NOT NULL
    )
    WHEN "type" = 'stage'::"MembershipType" THEN EXISTS (
      SELECT 1 FROM "invites" 
      WHERE "invites"."id" = invite_id 
      AND "invites"."stageId" IS NOT NULL
    )
    ELSE TRUE
  END;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint using the function
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_check_pub_stage_form_exists" 
CHECK (check_invite_has_pub_or_stage("type", "inviteId"));