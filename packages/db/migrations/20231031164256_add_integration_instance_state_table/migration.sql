-- CreateTable
CREATE TABLE "IntegrationInstanceState" (
    "pub_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "value" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationInstanceState_pub_id_instance_id_key" ON "IntegrationInstanceState"("pub_id", "instance_id");

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_pub_id_fkey" FOREIGN KEY ("pub_id") REFERENCES "pubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationInstanceState" ADD CONSTRAINT "IntegrationInstanceState_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "integration_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
