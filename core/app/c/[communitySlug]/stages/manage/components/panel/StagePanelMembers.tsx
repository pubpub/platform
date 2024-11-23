import { Suspense } from "react";
import Link from "next/link";

import type { StagesId } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Card, CardContent } from "ui/card";
import { cn } from "utils";

import { AddMemberDialog } from "~/app/c/[communitySlug]/members/[[...add]]/AddMemberDialog";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "~/lib/db/queries";
import { addStageMember, addUserWithStageMembership } from "../../actions";
import { MembersList } from "./MembersList";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RoleSelect } from "./RoleSelect";

type PropsInner = {
	stageId: StagesId;
	isSuperAdmin: boolean;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId).execute();

	return (
		<MembersList
			members={members}
			addMemberButton={
				<AddMemberDialog
					addMember={addStageMember.bind(null, props.stageId)}
					addUserMember={addUserWithStageMembership.bind(null, props.stageId)}
					existingMembers={members.map((member) => member.id)}
					isSuperAdmin={props.isSuperAdmin}
				/>
			}
			roleSelect={RoleSelect}
			removeButton={RemoveMemberButton}
			innerProps={{ stageId: props.stageId }}
		/>
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
