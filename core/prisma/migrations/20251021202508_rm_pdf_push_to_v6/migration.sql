/*
  Warnings:

  - The values [pdf,pushToV6] on the enum `Action` will be removed. If these variants are still used in the database, this will fail.

*/

-- Delete pdf and pushToV6 action instances
DELETE FROM "action_instances" WHERE "action" IN ('pdf', 'pushToV6');

-- AlterEnum
BEGIN;
CREATE TYPE "Action_new" AS ENUM ('log', 'email', 'http', 'move', 'googleDriveImport', 'datacite', 'buildJournalSite');
ALTER TABLE "action_instances" ALTER COLUMN "action" TYPE "Action_new" USING ("action"::text::"Action_new");
ALTER TABLE "action_config_defaults" ALTER COLUMN "action" TYPE "Action_new" USING ("action"::text::"Action_new");
ALTER TYPE "Action" RENAME TO "Action_old";
ALTER TYPE "Action_new" RENAME TO "Action";
DROP TYPE "Action_old";
COMMIT;
