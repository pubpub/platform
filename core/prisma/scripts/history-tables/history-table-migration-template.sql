/*
 Warnings:

 - Added the required column `lastModifiedBy` to the `{{tableName}}` table without a default value. This is not possible if the table is not empty.
 */
-- AlterTable
ALTER TABLE "{{tableName}}"
  ADD COLUMN "lastModifiedBy" TEXT NOT NULL;

ALTER TABLE "{{tableName}}"
  ALTER COLUMN "lastModifiedBy" TYPE modified_by_type;

-- backfill base `lastModifiedBy` column
UPDATE
  "{{tableName}}"
SET
  "lastModifiedBy" = 'unknown'
WHERE
  "lastModifiedBy" IS NULL;

-- CreateTable
CREATE TABLE "{{historyTableName}}"(
  "histId" text NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "operationType" "OperationType" NOT NULL,
  "oldRowData" jsonb,
  "newRowData" jsonb,
  "primaryKeyValue" text,
  "userId" text,
  "apiAccessTokenId" text,
  "actionRunId" text,
  "other" text,
  CONSTRAINT "{{historyTableName}}_pkey" PRIMARY KEY ("histId")
);

-- AddForeignKey
ALTER TABLE "{{historyTableName}}"
  ADD CONSTRAINT "{{historyTableName}}_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "{{historyTableName}}"
  ADD CONSTRAINT "{{historyTableName}}_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "{{historyTableName}}"
  ADD CONSTRAINT "{{historyTableName}}_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE {{historyTableName}}
  ADD CONSTRAINT chk_{{historyTableName}}_crudtype_rowdata CHECK (("operationType" = 'insert' AND "oldRowData" IS NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'update' AND "oldRowData" IS NOT NULL AND "newRowData" IS NOT NULL) OR ("operationType" = 'delete' AND "oldRowData" IS NOT NULL AND "newRowData" IS NULL));

-- backfill {{historyTableName}} with existing data
-- we just set it to insert the current row data, as we do not know who created it
-- we do not set a perpetrator for the existing data, as it is not possible to know who created it
-- setting a createAt manually is risky, as the base table might not have a createdAt/updateAt column. therefore we set the base case to the current timestamp
INSERT INTO "{{historyTableName}}" (
  "operationType",
  "oldRowData",
  "newRowData",
  "primaryKeyValue"
)
SELECT
  'insert'::"OperationType",
  NULL,
  row_to_json(t),
  t.id
FROM
  "{{tableName}}" t;

CREATE TRIGGER trigger_{{historyTableName}}
  AFTER INSERT OR UPDATE ON {{tableName}}
  FOR EACH ROW
  EXECUTE FUNCTION f_generic_history();

