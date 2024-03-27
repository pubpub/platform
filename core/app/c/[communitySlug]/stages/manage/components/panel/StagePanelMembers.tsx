import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageMembers } from "./queries";

type PropsInner = {
	stageId: string;
};

const StagePanelMembersInner = async (props: PropsInner) => {
	const members = await getStageMembers(props.stageId);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Members</CardTitle>
			</CardHeader>
			<CardContent>
				<p>Member count: {members.size}</p>
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
