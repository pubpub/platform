import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageActions } from "./queries";

type PropsInner = {
	stageId: string;
};

const StagePanelActionsInner = async (props: PropsInner) => {
	const actions = await getStageActions(props.stageId);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Actions</CardTitle>
			</CardHeader>
			<CardContent>
				<p>Action count: {actions.length}</p>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
};

export const StagePanelActions = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelActionsInner stageId={props.stageId} />
		</Suspense>
	);
};
