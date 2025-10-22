-- AlterTable
ALTER TABLE "_FormElementToPubType" ADD CONSTRAINT "_FormElementToPubType_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_FormElementToPubType_AB_unique";

-- AlterTable
ALTER TABLE "_MemberGroupToUser" ADD CONSTRAINT "_MemberGroupToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_MemberGroupToUser_AB_unique";
