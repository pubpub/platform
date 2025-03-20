-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "communityId" TEXT NOT NULL,
    "communityRole" "MemberRole" NOT NULL DEFAULT 'contributor',
    "pubId" TEXT,
    "formId" TEXT,
    "stageId" TEXT,
    "otherRole" "MemberRole",
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "sendAttempts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT,
    "invitedByActionRunId" TEXT,
    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- Create unique token constraint
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- Add constraint: exactly one of pubId, formId, stageId
ALTER TABLE "invites" ADD CONSTRAINT "exclusive_resource_constraint" 
CHECK (
    (CASE WHEN "pubId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "formId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "stageId" IS NOT NULL THEN 1 ELSE 0 END) <= 1
);

-- Add constraint: if pubId or stageId is set, otherRole must be set
ALTER TABLE "invites" ADD CONSTRAINT "other_role_required"
CHECK (
    ("pubId" IS NULL AND "stageId" IS NULL) OR "otherRole" IS NOT NULL
);

-- Add constraint: exactly one of email or userId must be set
ALTER TABLE "invites" ADD CONSTRAINT "user_identification_constraint"
CHECK (
    (("email" IS NOT NULL)::integer + ("userId" IS NOT NULL)::integer) = 1
);

-- Add constraint: ensure invitedByUserId or invitedByActionRunId is set
ALTER TABLE "invites" ADD CONSTRAINT "invited_by_required"
CHECK (
    ("invitedByUserId" IS NOT NULL) OR ("invitedByActionRunId" IS NOT NULL)
);

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_pubId_fkey" FOREIGN KEY ("pubId") REFERENCES "pubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedByActionRunId_fkey" FOREIGN KEY ("invitedByActionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
