-- CreateTable
CREATE TABLE "_FormToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FormToPermission_AB_unique" ON "_FormToPermission"("A", "B");

-- CreateIndex
CREATE INDEX "_FormToPermission_B_index" ON "_FormToPermission"("B");

-- AddForeignKey
ALTER TABLE "_FormToPermission" ADD CONSTRAINT "_FormToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormToPermission" ADD CONSTRAINT "_FormToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
