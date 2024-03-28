import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { StagePanelActionCreator } from "./StagePanelActionCreator";
import { getActions, getStage, getStageActions } from "./queries";
import { StagePanelActionEditor } from "./StagePanelActionEditor";
import { ActionPayload, StagePayloadActionInstance } from "~/lib/types";
import { addAction, deleteAction } from "../../actions";

type PropsInner = {
	stageId: string;
};

const StagePanelActionsInner = async (props: PropsInner) => {
	const stage = await getStage(props.stageId);
	const actions = await getActions();
	const actionInstances = await getStageActions(props.stageId);

	if (stage === null) {
		return <SkeletonCard />;
	}

	const onAddAction = async (action: ActionPayload) => {
		"use server";
		await addAction(stage.communityId, stage.id, action.id);
	};

	const onDeleteAction = async (action: StagePayloadActionInstance) => {
		"use server";
		await deleteAction(stage.communityId, action.id);
	};

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold mb-2 text-base">Actions</h4>
				{actionInstances.length > 0 ? (
					<p>
						<em>{stage.name}</em> has {actionInstances.length} action
						{actionInstances.length > 1 ? "s" : ""}.
					</p>
				) : (
					<p>
						<em>{stage.name}</em> has no actions. Use the button below to add one.
					</p>
				)}
				<div className="flex flex-col gap-2">
					{actionInstances.map((actionInstance) => (
						<StagePanelActionEditor
							key={actionInstance.id}
							actionInstance={actionInstance}
							onDelete={onDeleteAction}
						/>
					))}
				</div>
				<StagePanelActionCreator actions={actions} onAdd={onAddAction} />
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
