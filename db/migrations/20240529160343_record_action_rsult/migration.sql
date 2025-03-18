/*
  Warnings:

  - Added the required column `result` to the `action_runs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "action_runs" ADD COLUMN     "result" JSONB NOT NULL;
