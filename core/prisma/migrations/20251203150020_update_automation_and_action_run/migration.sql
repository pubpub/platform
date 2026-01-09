DROP TRIGGER IF EXISTS action_runs_change_trigger ON action_runs;

-- AlterTable
ALTER TABLE "action_runs"
    ADD COLUMN "action" "Action";

-- Backfill action from action_instances
UPDATE
    "action_runs" ar
SET
    "action" = ai."action"
FROM
    "action_instances" ai
WHERE
    ar."actionInstanceId" = ai."id";

-- AlterTable: add new columns
ALTER TABLE "automation_runs"
    ADD COLUMN "inputJson" jsonb,
    ADD COLUMN "inputPubId" text,
    ADD COLUMN "sourceUserId" text,
    ADD COLUMN "triggerConfig" jsonb,
    ADD COLUMN "triggerEvent" "AutomationEvent";

-- migrate data from old columns to new columns
UPDATE
    "automation_runs" aur
SET
    "triggerEvent" = aur."event",
    "triggerConfig" = aur."config",
    "sourceUserId" = aur."userId",
    "inputPubId" =(
        SELECT
            acr."pubId"
        FROM
            "action_runs" acr
        WHERE
            acr."automationRunId" = aur."id"
        ORDER BY
            acr."createdAt" ASC
        LIMIT 1);

-- For automation_runs that don't have an inputPubId, set inputJson to an empty object
UPDATE "automation_runs" 
SET "inputJson" = '{}'::jsonb 
WHERE "inputPubId" IS NULL AND "inputJson" IS NULL;

-- now that data is migrated, make required columns not null
ALTER TABLE "automation_runs"
    ALTER COLUMN "triggerEvent" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "automation_runs"
    ADD CONSTRAINT "automation_runs_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "automation_runs"
--     ADD CONSTRAINT "automation_runs_inputPubId_fkey" FOREIGN KEY ("inputPubId") REFERENCES "pubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- add constraint: at least one of inputJson or inputPubId must be meaningful
-- inputJson must not be null OR inputPubId must be set
ALTER TABLE "automation_runs"
    ADD CONSTRAINT "automation_runs_input_check" CHECK ("inputPubId" IS NOT NULL OR "inputJson" IS NOT NULL);

-- Validate the constraint (this will check all existing rows)
ALTER TABLE "automation_runs" VALIDATE CONSTRAINT "automation_runs_input_check";

-- contract phase (dropping old columns)
ALTER TABLE "automation_runs"
    DROP CONSTRAINT "automation_runs_userId_fkey";

-- AlterTable
ALTER TABLE "automation_runs"
    DROP COLUMN "config",
    DROP COLUMN "event",
    DROP COLUMN "userId";

CREATE OR REPLACE TRIGGER action_runs_change_trigger
    AFTER INSERT OR UPDATE -- Removed delete
    ON action_runs
    FOR EACH ROW
    EXECUTE FUNCTION notify_change_action_runs();

