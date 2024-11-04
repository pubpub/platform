import type {
	PermissionPayload,
	PermissionPayloadUser,
} from "./server/_legacy-integration-queries";

export const getPubUsers = (permissions: PermissionPayload[]) => {
	const users: PermissionPayloadUser[] = [];
	for (const permission of permissions) {
		if (permission.member) {
			users.push(permission.member.user);
		} else if (permission.memberGroup) {
			for (const user of permission.memberGroup.users) {
				users.push(user);
			}
		} else {
			throw new Error("Invalid permission");
		}
	}
	return users;
};

enum Capabilities {
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
	manageStage = "manageStage", // includes managing stage name, actions, rules, and move constraints
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
