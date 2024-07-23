-- AlterTable
ALTER TABLE "member_groups"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'editor';

-- Migrate data
UPDATE "member_groups"
set
    "role" = 'admin'
where
    "canAdmin" = true;