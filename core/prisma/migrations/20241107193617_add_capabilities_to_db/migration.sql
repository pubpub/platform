-- CreateEnum
CREATE TYPE "Capabilities" AS ENUM ('movePub', 'createPub', 'viewPub', 'deletePub', 'updatePubValues', 'createRelatedPub', 'createPubWithForm', 'editPubWithForm', 'createPubField', 'archivePubField', 'editPubField', 'createPubType', 'editPubType', 'deletePubType', 'runAction', 'viewStage', 'createStage', 'manageStage', 'deleteStage', 'addPubMember', 'removePubMember', 'addStageMember', 'removeStageMember', 'addFormMember', 'removeFormMember', 'addCommunityMember', 'removeCommunityMember', 'manageMemberGroups', 'addCommunity', 'editCommunity', 'createForm', 'editForm', 'archiveForm', 'createApiToken', 'revokeApiToken');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('community', 'stage', 'pub', 'form');

-- CreateTable
CREATE TABLE "membership_capabilities" (
    "role" "MemberRole" NOT NULL,
    "type" "MembershipType" NOT NULL,
    "capability" "Capabilities" NOT NULL,

    CONSTRAINT "membership_capabilities_pkey" PRIMARY KEY ("role","type","capability")
);
