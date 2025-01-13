// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod"

/** Represents the enum public.Capabilities */
export enum Capabilities {
	movePub = "movePub",
	createPub = "createPub",
	viewPub = "viewPub",
	deletePub = "deletePub",
	updatePubValues = "updatePubValues",
	createRelatedPub = "createRelatedPub",
	createPubWithForm = "createPubWithForm",
	editPubWithForm = "editPubWithForm",
	createPubField = "createPubField",
	archivePubField = "archivePubField",
	editPubField = "editPubField",
	createPubType = "createPubType",
	editPubType = "editPubType",
	deletePubType = "deletePubType",
	runAction = "runAction",
	viewStage = "viewStage",
	createStage = "createStage",
	manageStage = "manageStage",
	deleteStage = "deleteStage",
	addPubMember = "addPubMember",
	removePubMember = "removePubMember",
	addStageMember = "addStageMember",
	removeStageMember = "removeStageMember",
	addFormMember = "addFormMember",
	removeFormMember = "removeFormMember",
	addCommunityMember = "addCommunityMember",
	removeCommunityMember = "removeCommunityMember",
	manageMemberGroups = "manageMemberGroups",
	addCommunity = "addCommunity",
	editCommunity = "editCommunity",
	createForm = "createForm",
	editForm = "editForm",
	archiveForm = "archiveForm",
	createApiToken = "createApiToken",
	revokeApiToken = "revokeApiToken",
}

/** Zod schema for Capabilities */
export const capabilitiesSchema = z.nativeEnum(Capabilities)
