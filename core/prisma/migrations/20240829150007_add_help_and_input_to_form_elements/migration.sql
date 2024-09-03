-- CreateEnum
CREATE TYPE "InputComponent" AS ENUM ('textArea', 'textInput', 'date', 'boolean', 'fileUpload', 'memberSelect', 'confidenceInterval');

-- AlterTable
ALTER TABLE "form_elements" ADD COLUMN     "component" "InputComponent",
ADD COLUMN     "help" TEXT;
