-- AlterTable
ALTER TABLE "pub_fields" ADD COLUMN     "pubFieldSchemaId" TEXT;

-- CreateTable
CREATE TABLE "PubFieldSchema" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,

    CONSTRAINT "PubFieldSchema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PubFieldSchema_name_namespace_key" ON "PubFieldSchema"("name", "namespace");

-- AddForeignKey
ALTER TABLE "pub_fields" ADD CONSTRAINT "pub_fields_pubFieldSchemaId_fkey" FOREIGN KEY ("pubFieldSchemaId") REFERENCES "PubFieldSchema"("id") ON DELETE SET NULL ON UPDATE CASCADE;
