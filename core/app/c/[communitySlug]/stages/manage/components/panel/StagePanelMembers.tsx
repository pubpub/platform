import type { StagesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import type { User } from "lucia";
import { Suspense } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "ui/card";

import { MembersList } from "~/app/components//Memberships/MembersList";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { userCan } from "~/lib/authorization/capabilities";
import { getStageMembers } from "~/lib/db/queries";
import { getSimpleForms } from "~/lib/server/form";
import {
	addStageMember,
	addUserWithStageMembership,
	removeStageMember,
	setStageMemberRole,
} from "../../actions";
import { StagePanelCardHeader } from "../editor/StagePanelCard";

type PropsInner = {
	stageId: StagesId;
	user: User;
};

const StagePanelMembersInner = async ({ stageId, user }: PropsInner) => {
	const [members, canManage, availableForms] = await Promise.all([
		getStageMembers(stageId).execute(),
		userCan(
			Capabilities.removeStageMember,
			{ type: MembershipType.stage, stageId },
			user.id,
		),
		getSimpleForms(),
	]);

	return (
		<Card>
			<StagePanelCardHeader>
				<CardTitle>Members</CardTitle>
				<CardAction>
					<AddMemberDialog
						className="border-none bg-transparent shadow-none text-xs p-0 text-neutral-600 h-6 m-0 hover:bg-transparent hover:text-neutral-900"
						addMember={addStageMember.bind(null, stageId)}
						addUserMember={addUserWithStageMembership.bind(null, stageId)}
						existingMembers={members.map((member) => member.id)}
						isSuperAdmin={user.isSuperAdmin}
						membershipType={MembershipType.stage}
						availableForms={availableForms}
					/>
				</CardAction>
			</StagePanelCardHeader>
			<CardContent>
				<MembersList
					members={members}
					membershipType={MembershipType.stage}
					setRole={setStageMemberRole}
					removeMember={removeStageMember}
					targetId={stageId}
					readOnly={!canManage}
					availableForms={availableForms}
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
