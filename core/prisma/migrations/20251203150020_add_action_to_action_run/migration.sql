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

