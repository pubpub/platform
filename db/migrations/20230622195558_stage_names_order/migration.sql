/*
  Warnings:

  - Added the required column `name` to the `stages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `stages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `workflows` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "order" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "name" TEXT NOT NULL;
