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
	movePub,
	createPub,
	viewPub,
	updatePubValues,
	createRelatedPub,
	createPubWithForm,
	editPubWithForm,
	createPubField,
	archivePubField,
	editPubField,
	createPubType,
	editPubType,
	deletePubType,
	createStage,
	deleteStage,
	addMoveConstraint,
	removeMoveConstraint,
	addActionToStage,
	editAction,
	removeActionFromStage,
	addPubMember,
	addStageMember,
	addFormMember,
	addCommunityMember,
	createMemberGroup,
	addMemberToGroup,
	removeMemberFromGroup,
	addCommunity,
	createForm,
	editForm,
	archiveForm,
	createApiToken,
	revokeApiToken,
}
