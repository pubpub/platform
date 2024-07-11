-- AlterTable
ALTER TABLE "integration_instances" ADD COLUMN     "config" JSONB;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP DEFAULT;
