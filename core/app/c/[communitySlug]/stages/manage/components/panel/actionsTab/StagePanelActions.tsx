import { Suspense } from "react";

import type { StagesId, UsersId } from "db/public";
import { Card, CardContent } from "ui/card";

import { ActionConfigForm } from "~/app/components/ActionUI/ActionConfigForm";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getLoginData } from "~/lib/authentication/loginData";
import { getStage, getStageAutomations } from "~/lib/db/queries";
import { addAction, deleteAction } from "../../../actions";
import { StagePanelActionCreator } from "./StagePanelActionCreator";
import { StagePanelActionEditor } from "./StagePanelActionEditor";

type PropsInner = {
	stageId: StagesId;
	userId: UsersId;
};

const StagePanelActionsInner = async (props: PropsInner) => {
	const [stage, actionInstances] = await Promise.all([
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageAutomations(props.stageId).execute(),
	]);

	if (stage === undefined) {
		return <SkeletonCard />;
	}

	const onAddAction = addAction.bind(null, stage.id);
	const onDeleteAction = deleteAction;

	const { user } = await getLoginData();

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="mb-2 text-base font-semibold">Actions</h4>
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
							communityId={stage.communityId}
							stageId={props.stageId}
						>
							<ActionConfigForm
								stageId={props.stageId}
								actionInstance={actionInstance}
								defaultFields={actionInstance.defaultedActionConfigKeys ?? []}
							/>
						</StagePanelActionEditor>
					))}
				</div>
				<StagePanelActionCreator onAdd={onAddAction} isSuperAdmin={user?.isSuperAdmin} />
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	userId: UsersId;
};

export const StagePanelActions = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelActionsInner stageId={props.stageId} userId={props.userId} />
		</Suspense>
	);
};
