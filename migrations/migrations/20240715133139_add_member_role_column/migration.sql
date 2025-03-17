-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'editor', 'contributor');

-- AlterTable
ALTER TABLE "members"
ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'editor';

-- Migrate members
BEGIN;

UPDATE "members"
SET
    "role" = 'admin'
WHERE
    "canAdmin" = true;

COMMIT;