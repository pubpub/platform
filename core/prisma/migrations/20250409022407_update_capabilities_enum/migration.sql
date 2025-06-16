/*
Warnings:

- The values [createPub,updatePubValues] on the enum `Capabilities` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
DELETE FROM "membership_capabilities"
WHERE
  "capability" = 'createPub'::"Capabilities"
  OR "capability" = 'updatePubValues'::"Capabilities";

BEGIN;

CREATE TYPE "Capabilities_new" AS ENUM(
  'movePub',
  'viewPub',
  'deletePub',
  'createRelatedPub',
  'createPubWithForm',
  'createPubWithAnyForm',
  'editPubWithForm',
  'editPubWithAnyForm',
  'editPubWithDefaultForm',
  'createPubField',
  'archivePubField',
  'editPubField',
  'createPubType',
  'editPubType',
  'deletePubType',
  'runAction',
  'viewStage',
  'createStage',
  'manageStage',
  'deleteStage',
  'addPubMember',
  'removePubMember',
  'addStageMember',
  'removeStageMember',
  'addFormMember',
  'removeFormMember',
  'addCommunityMember',
  'removeCommunityMember',
  'manageMemberGroups',
  'addCommunity',
  'editCommunity',
  'createForm',
  'editForm',
  'archiveForm',
  'createApiToken',
  'revokeApiToken',
  'seeExtraPubValues'
);

ALTER TABLE "membership_capabilities"
ALTER COLUMN "capability" TYPE "Capabilities_new" USING ("capability"::TEXT::"Capabilities_new");

ALTER TYPE "Capabilities"
RENAME TO "Capabilities_old";

ALTER TYPE "Capabilities_new"
RENAME TO "Capabilities";

DROP TYPE "Capabilities_old";

COMMIT;
