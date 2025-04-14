-- CreateTable
CREATE TABLE "_FormElementToPubType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FormElementToPubType_AB_unique" ON "_FormElementToPubType"("A", "B");

-- CreateIndex
CREATE INDEX "_FormElementToPubType_B_index" ON "_FormElementToPubType"("B");

-- AddForeignKey
ALTER TABLE "_FormElementToPubType" ADD CONSTRAINT "_FormElementToPubType_A_fkey" FOREIGN KEY ("A") REFERENCES "form_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FormElementToPubType" ADD CONSTRAINT "_FormElementToPubType_B_fkey" FOREIGN KEY ("B") REFERENCES "pub_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
