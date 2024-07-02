import { Suspense } from "react";

import { Card, CardContent } from "ui/card";
import { Separator } from "ui/separator";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage } from "~/lib/db/queries";
import { deleteStage, updateStageName } from "../../actions";
import { StageNameInput } from "./StageNameInput";
import { StagePanelOverviewManagement } from "./StagePanelOverviewManagement";

type PropsInner = {
	stageId: string;
};

const StagePanelOverviewInner = async (props: PropsInner) => {
	const stage = await getStage(props.stageId);

	if (stage === undefined) {
		return <SkeletonCard />;
	}

	const onNameChange = updateStageName.bind(null, stage.communityId, stage.id);
	const onDelete = deleteStage.bind(null, stage.communityId, stage.id);

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<StageNameInput value={stage.name} onChange={onNameChange} />
				<Separator />
				<div className="space-y-2 py-2">
					<StagePanelOverviewManagement onDelete={onDelete} />
				</div>
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId: string | undefined;
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
