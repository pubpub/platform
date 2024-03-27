import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage } from "./queries";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";

type PropsInner = {
	stageId: string;
};

const StagePanelOverviewInner = async (props: PropsInner) => {
	const stage = await getStage(props.stageId);

	if (stage === null) {
		return <SkeletonCard />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Overview</CardTitle>
			</CardHeader>
			<CardContent>
				<p>{stage.name}</p>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
};

export const StagePanelOverview = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelOverviewInner stageId={props.stageId} />
		</Suspense>
	);
};
