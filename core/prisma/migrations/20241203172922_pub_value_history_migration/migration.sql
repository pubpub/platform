/*
  Warnings:

  - Added the required column `lastModifiedBy` to the `pub_values` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pub_values" ADD COLUMN "lastModifiedBy" TEXT NOT NULL;
ALTER TABLE "pub_values" ALTER COLUMN "lastModifiedBy" TYPE modified_by_type;
-- ALTER TABLE "pub_values" ADD CONSTRAINT "pub_values_lastModifiedBy_format_check" CHECK ("lastModifiedBy" ~ '^(user|action-run|api-access-token):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^(unknown|system)$');

-- CreateTable
CREATE TABLE "pub_values_history" (
    "histId" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operationType" "OperationType" NOT NULL,
    "oldRowData" JSONB,
    "newRowData" JSONB,
    "primaryKeyValue" TEXT,
    "userId" TEXT,
    "apiAccessTokenId" TEXT,
    "actionRunId" TEXT,
    "other" TEXT,

    CONSTRAINT "pub_values_history_pkey" PRIMARY KEY ("histId")
);

-- AddForeignKey
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_apiAccessTokenId_fkey" FOREIGN KEY ("apiAccessTokenId") REFERENCES "api_access_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pub_values_history" ADD CONSTRAINT "pub_values_history_actionRunId_fkey" FOREIGN KEY ("actionRunId") REFERENCES "action_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

alter table pub_values_history
add constraint chk_pub_values_history_crudtype_rowdata
check (   
       ("operationType" = 'insert' and "oldRowData" is null     and "newRowData" is not null)
    or ("operationType" = 'update' and "oldRowData" is not null and "newRowData" is not null)
    or ("operationType" = 'delete' and "oldRowData" is not null and "newRowData" is null    )
);


CREATE TRIGGER trigger_pub_values_history
AFTER INSERT OR UPDATE ON pub_values
FOR EACH ROW
EXECUTE FUNCTION f_generic_history();