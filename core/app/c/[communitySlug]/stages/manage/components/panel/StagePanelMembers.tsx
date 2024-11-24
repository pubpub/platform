import { Suspense } from "react";

import type { StagesId } from "db/public";
import { Card, CardContent } from "ui/card";
import { cn } from "utils";

import { MembersList } from "~/app/components//Memberships/MembersList";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "~/lib/db/queries";
import {
	addStageMember,
	addUserWithStageMembership,
	removeStageMember,
	setStageMemberRole,
} from "../../actions";

type PropsInner = {
	stageId: StagesId;
	isSuperAdmin: boolean;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId).execute();

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
						addMember={addStageMember.bind(null, props.stageId)}
						addUserMember={addUserWithStageMembership.bind(null, props.stageId)}
						existingMembers={members.map((member) => member.id)}
						isSuperAdmin={props.isSuperAdmin}
					/>
				</div>
				<MembersList
					members={members}
					setRole={setStageMemberRole}
					removeMember={removeStageMember}
					targetId={props.stageId}
				/>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	isSuperAdmin: boolean;
};

export const StagePanelMembers = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelMembersInner stageId={props.stageId} isSuperAdmin={props.isSuperAdmin} />
		</Suspense>
	);
};
