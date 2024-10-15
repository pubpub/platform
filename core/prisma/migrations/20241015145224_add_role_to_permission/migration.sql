-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "role" "MemberRole";

-- CreateTable
CREATE TABLE "_CommunityToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityToPermission_AB_unique" ON "_CommunityToPermission"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityToPermission_B_index" ON "_CommunityToPermission"("B");

-- AddForeignKey
ALTER TABLE "_CommunityToPermission" ADD CONSTRAINT "_CommunityToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityToPermission" ADD CONSTRAINT "_CommunityToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
