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

enum Privileges {
	movePub = "movePub",
	createPub = "createPub",
	viewPub = "viewPub",
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
	createStage = "createStage",
	deleteStage = "deleteStage",
	addMoveConstraint = "addMoveConstraint",
	removeMoveConstraint = "removeMoveConstraint",
	addActionToStage = "addActionToStage",
	editAction = "editAction",
	removeActionFromStage = "removeActionFromStage",
	addPubMember = "addPubMember",
	addStageMember = "addStageMember",
	addFormMember = "addFormMember",
	addCommunityMember = "addCommunityMember",
	createMemberGroup = "createMemberGroup",
	addMemberToGroup = "addMemberToGroup",
	removeMemberFromGroup = "removeMemberFromGroup",
	addCommunity = "addCommunity",
	createForm = "createForm",
	editForm = "editForm",
	archiveForm = "archiveForm",
	createApiToken = "createApiToken",
	revokeApiToken = "revokeApiToken",
}
