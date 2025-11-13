-- CreateEnum
CREATE TYPE "ConditionEvaluationTiming" AS ENUM ('onTrigger', 'onExecution', 'both');

-- AlterTable
ALTER TABLE "automations" ADD COLUMN     "conditionEvaluationTiming" "ConditionEvaluationTiming";
