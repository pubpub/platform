-- CreateEnum
CREATE TYPE "AutomationConditionBlockType" AS ENUM(
    'AND',
    'OR',
    'NOT'
);

-- CreateEnum
CREATE TYPE "AutomationConditionType" AS ENUM(
    'jsonata'
);

-- CreateTable
CREATE TABLE "automation_condition_blocks"(
    "id" text NOT NULL DEFAULT gen_random_uuid(),
    "type" "AutomationConditionBlockType" NOT NULL,
    "rank" text NOT NULL COLLATE "C",
    "automationConditionBlockId" text,
    "automationId" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_condition_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_conditions"(
    "id" text NOT NULL DEFAULT gen_random_uuid(),
    "automationConditionBlockId" text NOT NULL,
    "rank" text NOT NULL COLLATE "C",
    "type" "AutomationConditionType" NOT NULL,
    "expression" text NOT NULL,
    "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_conditions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "automation_condition_blocks"
    ADD CONSTRAINT "automation_condition_blocks_automationConditionBlockId_fkey" FOREIGN KEY ("automationConditionBlockId") REFERENCES "automation_condition_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_condition_blocks"
    ADD CONSTRAINT "automation_condition_blocks_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_conditions"
    ADD CONSTRAINT "automation_conditions_automationConditionBlockId_fkey" FOREIGN KEY ("automationConditionBlockId") REFERENCES "automation_condition_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "unique_action_chaining_events";

DROP INDEX IF EXISTS "unique_regular_events";

