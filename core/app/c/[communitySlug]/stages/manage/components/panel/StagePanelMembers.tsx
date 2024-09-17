import { Suspense } from "react";

import type { StagesId } from "db/public";
import { Card, CardContent } from "ui/card";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "~/lib/db/queries";

type PropsInner = {
	stageId: StagesId;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId).execute();

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="mb-2 text-base font-semibold">Members</h4>
				{members.map(({ user }) => (
					<div key={user.id} className="flex items-center justify-between">
						{user.firstName} {user.lastName}
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
