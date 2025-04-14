-- AlterTable

ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- Set existing users to verified
UPDATE "users" SET "isVerified" = true;