import type { User } from "lucia";

import { Suspense } from "react";

import type { StagesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Card, CardContent } from "ui/card";
import { cn } from "utils";

import { MembersList } from "~/app/components//Memberships/MembersList";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { userCan } from "~/lib/authorization/capabilities";
import { getStageMembers } from "~/lib/db/queries";
import {
	addStageMember,
	addUserWithStageMembership,
	removeStageMember,
	setStageMemberRole,
} from "../../actions";

type PropsInner = {
	stageId: StagesId;
	user: User;
};

const StagePanelMembersInner = async ({ stageId, user }: PropsInner) => {
	const members = await getStageMembers(stageId).execute();
	const canManage = await userCan(
		Capabilities.removeStageMember,
		{ type: MembershipType.stage, stageId },
		user.id
	);

	return (
		<Card>
			<CardContent className="space-y-4 p-4">
				<div
					className={cn(
						"flex items-center justify-between",
						members.length && "border-b-2 border-b-slate-200 pb-4"
					)}
				>
					<h4 className="mb-2 inline text-base font-semibold">Members</h4>
					<AddMemberDialog
						addMember={addStageMember.bind(null, stageId)}
						addUserMember={addUserWithStageMembership.bind(null, stageId)}
						existingMembers={members.map((member) => member.id)}
						isSuperAdmin={user.isSuperAdmin}
					/>
				</div>
				<MembersList
					members={members}
					setRole={setStageMemberRole}
					removeMember={removeStageMember}
					targetId={stageId}
					readOnly={!canManage}
				/>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	user: User;
};

export const StagePanelMembers = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelMembersInner stageId={props.stageId} user={props.user} />
		</Suspense>
	);
};
