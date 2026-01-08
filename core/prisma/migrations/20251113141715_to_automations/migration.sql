


DROP TRIGGER IF EXISTS action_runs_change_trigger ON action_runs;



/*
 Warnings:

 - You are about to drop the column `name` on the `action_instances` table. All the data in the column will be lost.
 - You are about to drop the column `stageId` on the `action_instances` table. All the data in the column will be lost.
 - You are about to drop the column `sourceActionRunId` on the `action_runs` table. All the data in the column will be lost.
 - You are about to drop the column `actionInstanceId` on the `automations` table. All the data in the column will be lost.
 - You are about to drop the column `event` on the `automations` table. All the data in the column will be lost.
 - You are about to drop the column `sourceActionInstanceId` on the `automations` table. All the data in the column will be lost.
 - Added the required column `automationId` to the `action_instances` table without a default value. This is not possible if the table is not empty.
 - Added the required column `communityId` to the `automations` table without a default value. This is not possible if the table is not empty.
 - Added the required column `name` to the `automations` table without a default value. This is not possible if the table is not empty.
 */
-- step 1: add stageId column to automations table (nullable)
ALTER TABLE "automations"
  ADD COLUMN "stageId" text;

-- step 2: add communityId column to automations table (temporarily nullable for data migration)
ALTER TABLE "automations"
  ADD COLUMN "communityId" text;

-- step 3: add foreign key for stageId
ALTER TABLE "automations"
  ADD CONSTRAINT "automations_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- step 4: add foreign key for communityId (will be made non-null later)
ALTER TABLE "automations"
  ADD CONSTRAINT "automations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- step 6: add name and description columns to automations (temporarily nullable for data migration)
ALTER TABLE "automations"
  ADD COLUMN "name" text;

-- this is just so the migration can be run
ALTER TABLE "automations"
  ALTER COLUMN "actionInstanceId" DROP NOT NULL;

ALTER TABLE "automations"
  ADD COLUMN "description" text;

-- step 7: add automationId column to action_instances (temporarily nullable for data migration)
ALTER TABLE "action_instances"
  ADD COLUMN "automationId" text;

-- step 8: add automationRunId column to action_runs (nullable)
ALTER TABLE "action_runs"
  ADD COLUMN "automationRunId" text;

-- step 9: create automation_runs table
CREATE TABLE "automation_runs"(
  "id" text NOT NULL DEFAULT gen_random_uuid(),
  "automationId" text NOT NULL,
  "event" "AutomationEvent" NOT NULL,
  "config" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceAutomationRunId" text,
  "userId" text,
  CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- add automation triggers table, this stores the triggers for each automation
CREATE TABLE "automation_triggers"(
  "id" text NOT NULL DEFAULT gen_random_uuid(),
  "automationId" text NOT NULL,
  "event" "AutomationEvent" NOT NULL,
  "config" jsonb,
  "sourceAutomationId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_triggers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "automation_triggers"
  ADD CONSTRAINT "automation_triggers_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_triggers"
  ADD CONSTRAINT "automation_triggers_sourceAutomationId_fkey" FOREIGN KEY ("sourceAutomationId") REFERENCES "automations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- step 10: populate communityId for existing automations based on their action_instance's stage
UPDATE
  "automations" a
SET
  "communityId" = s."communityId"
FROM
  "action_instances" ai
  INNER JOIN "stages" s ON s.id = ai."stageId"
WHERE
  a."actionInstanceId" = ai.id;

-- step 11: populate stageId for existing automations based on their action_instance's stage
UPDATE
  "automations" a
SET
  "stageId" = ai."stageId"
FROM
  "action_instances" ai
WHERE
  a."actionInstanceId" = ai.id;

-- step 12: create dummy automation for each community to re-parent deleted automation runs
INSERT INTO "automations"(id, name, description, "communityId", "stageId", event, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'Deleted Automations',
  'Placeholder automation for automation runs from deleted automations',
  c.id,
  NULL,
  'manual',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM
  "communities" c;

-- step 13: migrate action_instance name to automation name for existing automations
UPDATE
  "automations" a
SET
  name = ai.name
FROM
  "action_instances" ai
WHERE
  a."actionInstanceId" = ai.id
  AND a.name IS NULL;

-- step 14: create automation triggers for existing automations
-- migrate the event, config, and sourceActionInstanceId to triggers
-- INSERT INTO "automation_triggers"(id, "automationId", event, config, "sourceAutomationId", "createdAt", "updatedAt")
-- SELECT
--   gen_random_uuid(),
--   a.id,
--   a.event,
--   a.config,
--   a."sourceActionInstanceId",
--   a."createdAt",
--   a."updatedAt"
-- FROM
--   "automations" a
-- WHERE
--   a.event IS NOT NULL;
-- step 15: create new automations for action_instances that don't have one yet
-- this handles standalone actions that were only meant to be run manually
INSERT INTO "automations"(id, name, description, "communityId", "stageId", event, "createdAt", "updatedAt", "actionInstanceId")
SELECT
  gen_random_uuid(),
  ai.name,
  NULL,
  s."communityId",
  ai."stageId",
  'manual',
  ai."createdAt",
  ai."updatedAt",
  ai.id
FROM
  "action_instances" ai
  INNER JOIN "stages" s ON s.id = ai."stageId"
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      "automations" a
    WHERE
      a."actionInstanceId" = ai.id);

-- step 16: create manual triggers for all new standalone automations
INSERT INTO "automation_triggers"(id, "automationId", event, config, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  a.id,
  'manual',
  NULL,
  a."createdAt",
  a."updatedAt"
FROM
  "automations" a
  INNER JOIN "action_instances" ai ON ai.name = a.name
    AND ai."stageId" = a."stageId"
WHERE
  a."actionInstanceId" IS NULL
  AND NOT EXISTS (
    SELECT
      1
    FROM
      "automation_triggers" at
    WHERE
      at."automationId" = a.id);

-- step 17: add manual triggers to existing automations that came from action_instances
-- all action instances could be run manually, so add manual trigger to each
INSERT INTO "automation_triggers"(id, "automationId", event, config, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  a.id,
  'manual',
  NULL,
  a."createdAt",
  a."updatedAt"
FROM
  "automations" a
WHERE
  a."actionInstanceId" IS NOT NULL
  AND a."stageId" IS NOT NULL
  AND NOT EXISTS (
    SELECT
      1
    FROM
      "automation_triggers" at
    WHERE
      at."automationId" = a.id
      AND at.event = 'manual');

-- step 18: update action_instances to reference their automation
-- for those with existing automations
UPDATE
  "action_instances" ai
SET
  "automationId" = a.id
FROM
  "automations" a
WHERE
  a."actionInstanceId" = ai.id;

-- step 19: for those we just created (manual-only automations), link them
UPDATE
  "action_instances" ai
SET
  "automationId" =(
    SELECT
      a.id
    FROM
      "automations" a
    WHERE
      a.name = ai.name
      AND a."stageId" = ai."stageId"
      AND a."actionInstanceId" IS NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          "action_instances" ai2
        WHERE
          ai2."automationId" = a.id)
      LIMIT 1)
WHERE
  "automationId" IS NULL;

-- step 20: create automation runs for all existing action runs
-- link them to the automations that were created from their action_instances
INSERT INTO "automation_runs"(id, "automationId", event, config, "createdAt", "updatedAt", "sourceAutomationRunId")
SELECT
  gen_random_uuid() AS id,
  ai."automationId",
  COALESCE(ar.event, 'manual') AS event,
  ar.config AS config,
  ar."createdAt",
  ar."updatedAt",
  NULL AS "sourceAutomationRunId"
  -- ar."sourceAutomationRunId"
FROM
  "action_runs" ar
  INNER JOIN "action_instances" ai ON ai.id = ar."actionInstanceId"
WHERE
  ar."actionInstanceId" IS NOT NULL
  AND ai."automationId" IS NOT NULL;

-- step 21: link action_runs to their new automation_runs
-- create a temporary mapping table to match them correctly
CREATE TEMP TABLE temp_action_run_mapping AS
SELECT
  ar.id AS action_run_id,
  arun.id AS automation_run_id,
  ROW_NUMBER() OVER (PARTITION BY ar.id ORDER BY arun."createdAt", arun.id) AS rn
FROM
  "action_runs" ar
  INNER JOIN "automation_runs" arun ON arun."createdAt" = ar."createdAt"
    AND arun."updatedAt" = ar."updatedAt"
WHERE
  ar."actionInstanceId" IS NOT NULL;

UPDATE
  "action_runs" ar
SET
  "automationRunId" = m.automation_run_id
FROM
  temp_action_run_mapping m
WHERE
  m.action_run_id = ar.id
  AND m.rn = 1;

-- step 21b: update sourceAutomationRunId on automation_runs based on sourceActionRunId chain
UPDATE
  "automation_runs" arun
SET
  "sourceAutomationRunId" = m_source.automation_run_id
FROM
  temp_action_run_mapping m
  INNER JOIN "action_runs" ar ON ar.id = m.action_run_id
  INNER JOIN temp_action_run_mapping m_source ON m_source.action_run_id = ar."sourceActionRunId"
WHERE
  arun.id = m.automation_run_id
  AND ar."sourceActionRunId" IS NOT NULL
  AND m.rn = 1
  AND m_source.rn = 1;

DROP TABLE temp_action_run_mapping;

-- step 22: drop old foreign key constraints
ALTER TABLE "action_instances"
  DROP CONSTRAINT IF EXISTS "action_instances_stageId_fkey";

ALTER TABLE "action_runs"
  DROP CONSTRAINT IF EXISTS "action_runs_sourceActionRunId_fkey";

ALTER TABLE "automations"
  DROP CONSTRAINT IF EXISTS "automations_actionInstanceId_fkey";

ALTER TABLE "automations"
  DROP CONSTRAINT IF EXISTS "automations_sourceActionInstanceId_fkey";

-- step 23: drop old columns from action_instances
ALTER TABLE "action_instances"
  DROP COLUMN IF EXISTS "name";

ALTER TABLE "action_instances"
  DROP COLUMN IF EXISTS "stageId";

-- step 24: drop old column from action_runs
ALTER TABLE "action_runs"
  DROP COLUMN IF EXISTS "sourceActionRunId";

-- step 25: drop old columns from automations
ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "actionInstanceId";

ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "event";

ALTER TABLE "automations"
  DROP COLUMN IF EXISTS "sourceActionInstanceId";

-- step 26: make name column non-nullable now that data is migrated
ALTER TABLE "automations"
  ALTER COLUMN "name" SET NOT NULL;

-- step 27: make communityId column non-nullable now that data is migrated
ALTER TABLE "automations"
  ALTER COLUMN "communityId" SET NOT NULL;

-- step 28: make automationId column non-nullable now that data is migrated
ALTER TABLE "action_instances"
  ALTER COLUMN "automationId" SET NOT NULL;

-- step 29: add new foreign key constraints
ALTER TABLE "action_instances"
  ADD CONSTRAINT "action_instances_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_runs"
  ADD CONSTRAINT "automation_runs_sourceAutomationRunId_fkey" FOREIGN KEY ("sourceAutomationRunId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_runs"
  ADD CONSTRAINT "action_runs_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- step 30: add unique constraint for null stageId per community
-- this ensures only one dummy automation per community
CREATE UNIQUE INDEX "automations_null_stageId_per_community" ON "automations"("communityId")
WHERE
  "stageId" IS NULL;

-- step 31: create trigger function to auto-create dummy automation on community creation
CREATE OR REPLACE FUNCTION create_dummy_automation_for_community()
  RETURNS TRIGGER
  AS $$
BEGIN
  INSERT INTO "automations"(id, name, description, "communityId", "stageId", "createdAt", "updatedAt")
    VALUES(gen_random_uuid(), 'Deleted Automations', 'Placeholder automation for re-parenting runs from deleted automations', NEW.id, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER create_dummy_automation_after_community_insert
  AFTER INSERT ON "communities"
  FOR EACH ROW
  EXECUTE FUNCTION create_dummy_automation_for_community();

-- step 32: create trigger function to re-parent automation_runs when automation is deleted
CREATE OR REPLACE FUNCTION reparent_automation_runs_on_delete()
  RETURNS TRIGGER
  AS $$
DECLARE
  dummy_automation_id text;
BEGIN
  -- don't reparent if we're deleting the dummy itself
  IF OLD."stageId" IS NULL AND OLD.name = 'Deleted Automations' THEN
    RETURN OLD;
  END IF;
  -- find the dummy automation for this community
  SELECT
    a.id INTO dummy_automation_id
  FROM
    "automations" a
  WHERE
    a."communityId" = OLD."communityId"
    AND a."stageId" IS NULL
    AND a.name = 'Deleted Automations'
  LIMIT 1;
  -- re-parent all automation_runs from the deleted automation to the dummy
  IF dummy_automation_id IS NOT NULL THEN
    UPDATE
      "automation_runs"
    SET
      "automationId" = dummy_automation_id
    WHERE
      "automationId" = OLD.id;
  END IF;
  RETURN OLD;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER reparent_automation_runs_before_automation_delete
  BEFORE DELETE ON "automations"
  FOR EACH ROW
  EXECUTE FUNCTION reparent_automation_runs_on_delete();



CREATE OR REPLACE TRIGGER action_runs_change_trigger
    AFTER INSERT OR UPDATE -- Removed delete
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_change_action_runs();
