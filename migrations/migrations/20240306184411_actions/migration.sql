-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActionToPubField" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "actions_name_key" ON "actions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ActionToPubField_AB_unique" ON "_ActionToPubField"("A", "B");

-- CreateIndex
CREATE INDEX "_ActionToPubField_B_index" ON "_ActionToPubField"("B");

-- AddForeignKey
ALTER TABLE "_ActionToPubField" ADD CONSTRAINT "_ActionToPubField_A_fkey" FOREIGN KEY ("A") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActionToPubField" ADD CONSTRAINT "_ActionToPubField_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
