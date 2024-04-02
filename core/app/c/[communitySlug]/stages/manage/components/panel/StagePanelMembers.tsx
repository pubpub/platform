import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "./queries";
import { Card, CardContent } from "ui/card";

type PropsInner = {
	stageId: string;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const users = Array.from((await getStageMembers(props.stageId)).values());

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold mb-2 text-base">Members</h4>
				{users.map((user) => (
					<div key={user.id} className="flex items-center justify-between">
						{user.firstName} {user.lastName}
					</div>
				))}
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
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
