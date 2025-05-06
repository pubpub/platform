/*
 Warnings:

 - Added the required column `lastModifiedBy` to the `invites` table without a default value. This is not possible if the table is not empty.
 */
-- AlterTable
-- first we add the column with a default value
ALTER TABLE "invites"
  ADD COLUMN "lastModifiedBy" modified_by_type NOT NULL DEFAULT CONCAT('unknown', '|', FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000));

-- then we remove the default value
ALTER TABLE "invites"
  ALTER COLUMN "lastModifiedBy" DROP DEFAULT;

-- CreateTable
CREATE TABLE "invites_history"(
  "id" text NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "operationType" "OperationType" NOT NULL,
  "oldRowData" jsonb,
  "newRowData" jsonb,
  "inviteId" text,
  "userId" text,
  "apiAccessTokenId" text,
  "actionRunId" text,
  "other" text,
  CONSTRAINT "invites_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_history"
  ADD CONSTRAINT "invites_history_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE invites_history
  ADD CONSTRAINT chk_invites_history_crudtype_rowdata CHECK (("operationType" = 'insert' AND "oldRowData" IS NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'update' AND "oldRowData" IS NOT NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'delete' AND "oldRowData" IS NOT NULL AND "newRowData" IS NULL));

-- backfill invites_history with existing data
-- we just set it to insert the current row data, as we do not know who created it
-- we do not set a perpetrator for the existing data, as it is not possible to know who created it
-- setting a createAt manually is risky, as the base table might not have a createdAt/updateAt column. therefore we set the base case to the current timestamp
INSERT INTO "invites_history" (
  "operationType",
  "oldRowData",
  "newRowData",
  "inviteId"
)
SELECT
  'insert'::"OperationType",
  NULL,
  row_to_json(t),
  t.id
FROM
  "invites" t;

CREATE TRIGGER trigger_invites_history
  AFTER INSERT OR UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION f_generic_history('inviteId');

