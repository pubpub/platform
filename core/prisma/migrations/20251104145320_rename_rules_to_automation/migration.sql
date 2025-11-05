/*
 Warnings:

 - You are about to rename the `rules` table to `automations`.
 */
-- AlterTable
ALTER TABLE "rules" RENAME TO "automations";

-- RenameConstraint
ALTER TABLE "automations" RENAME CONSTRAINT "rules_pkey" TO "automations_pkey";

-- RenameConstraint
ALTER TABLE "automations" RENAME CONSTRAINT "rules_actionInstanceId_fkey" TO "automations_actionInstanceId_fkey";

-- RenameConstraint
ALTER TABLE "automations" RENAME CONSTRAINT "rules_sourceActionInstanceId_fkey" TO "automations_sourceActionInstanceId_fkey";

