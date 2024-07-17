-- AlterTable
ALTER TABLE "forms"
ADD COLUMN "permissionId" TEXT;

-- AlterTable
ALTER TABLE "member_groups"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'editor';

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate data
UPDATE "member_groups"
set
    "role" = 'admin'
where
    "canAdmin" = true;