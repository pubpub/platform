import { Suspense } from "react";

import type { StagesId } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Trash } from "ui/icon";

import { AddMemberDialog } from "~/app/c/[communitySlug]/members/[[...add]]/AddMemberDialog";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "~/lib/db/queries";
import { useServerAction } from "~/lib/serverActions";
import { removeStageMember } from "../../actions";

type PropsInner = {
	stageId: StagesId;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId).execute();
	const runRemoveMember = useServerAction(removeStageMember);

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="mb-2 text-base font-semibold">Members</h4>
				<AddMemberDialog />
				{members.map((user) => (
					<div key={user.id} className="flex items-center justify-between">
						<span>
							{user.firstName} {user.lastName}
						</span>
						<Button
							variant="secondary"
							size="sm"
							className="flex gap-2"
							onClick={() => runRemoveMember(user.id, props.stageId)}
						>
							<Trash size={14} />
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
};

export const StagePanelMembers = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelMembersInner stageId={props.stageId} />
		</Suspense>
	);
};
