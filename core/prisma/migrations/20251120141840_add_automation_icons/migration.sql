-- drop old icon columns if they exist
-- DropForeignKey
ALTER TABLE "automation_runs"
  DROP CONSTRAINT "automation_runs_userId_fkey";

-- AlterTable
ALTER TABLE "automations"
  DROP COLUMN "config";

-- AddForeignKey
ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "filled";

ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "iconColor";

ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "icon";

-- add new icon column as jsonb
ALTER TABLE "automations"
  ADD COLUMN "icon" jsonb;

-- set icons for existing automations based on their action instances
-- log action: terminal icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "terminal"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'log';

-- email action: mail icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "mail"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'email';

-- http action: globe icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "globe"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'http';

-- move action: move-horizontal icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "move-horizontal"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'move';

-- googleDriveImport action: cloud icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "cloud"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'googleDriveImport';

-- datacite action: globe icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "globe"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'datacite';

-- buildJournalSite action: book icon
UPDATE
  "automations" a
SET
  "icon" = '{"name": "book"}'::jsonb
FROM
  "action_instances" ai
WHERE
  ai."automationId" = a.id
  AND ai.action = 'buildJournalSite';

-- set default bot icon for automations that don't have an icon yet
-- this includes automations that existed before the migration or don't have action instances
UPDATE
  "automations"
SET
  "icon" = '{"name": "bot"}'::jsonb
WHERE
  "icon" IS NULL;

