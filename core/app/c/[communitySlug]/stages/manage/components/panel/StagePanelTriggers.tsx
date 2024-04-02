import { Suspense } from "react";
import { Card, CardContent } from "ui/card";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage } from "./queries";
import { Button } from "ui/button";

type PropsInner = {
	stageId: string;
};

const StagePanelTriggersInner = async (props: PropsInner) => {
	const stage = await getStage(props.stageId);

	if (stage === null) {
		return <SkeletonCard />;
	}

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold mb-2 text-base">Rules</h4>
				<Button variant="secondary">Add a rule</Button>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
};

export const StagePanelTriggers = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelTriggersInner stageId={props.stageId} />
		</Suspense>
	);
};
