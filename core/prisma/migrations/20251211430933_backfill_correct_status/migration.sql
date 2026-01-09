-- backfill existing automation_runs with computed status
-- this needs to happen in a sep migration as you cannot use a changed enum in the same transaction that created it
UPDATE
  automation_runs ar
SET
  status =(
    SELECT
      CASE WHEN COUNT(*) FILTER (WHERE status = 'failure'::"ActionRunStatus") > 0 THEN
        'failure'::"ActionRunStatus"
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'success'::"ActionRunStatus") THEN
        'success'::"ActionRunStatus"
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'scheduled'::"ActionRunStatus") THEN
        'scheduled'::"ActionRunStatus"
      ELSE
        'pending'::"ActionRunStatus"
      END
    FROM
      action_runs
    WHERE
      "automationRunId" = ar.id)
WHERE
  EXISTS (
    SELECT
      1
    FROM
      action_runs
    WHERE
      "automationRunId" = ar.id);

