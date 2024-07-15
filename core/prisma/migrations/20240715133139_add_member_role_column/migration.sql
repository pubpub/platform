-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'member', 'contributor');

-- AlterTable
ALTER TABLE "members"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'member';

-- Migrate members
BEGIN;

UPDATE "members"
SET
    "role" = 'admin'
WHERE
    "canAdmin" = true;

COMMIT;