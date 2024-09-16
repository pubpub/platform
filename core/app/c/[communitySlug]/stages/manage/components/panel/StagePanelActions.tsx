import { Suspense } from "react";

import { Card, CardContent } from "ui/card";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { ActionConfigFormWrapper } from "~/app/components/ActionUI/ActionConfigFormWrapper";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getLoginData } from "~/lib/auth/loginData";
import { getStage, getStageActions } from "~/lib/db/queries";
import { addAction, deleteAction } from "../../actions";
import { StagePanelActionCreator } from "./StagePanelActionCreator";
import { StagePanelActionEditor } from "./StagePanelActionEditor";

type PropsInner = {
	stageId: string;
	pageContext: PageContext;
};

const StagePanelActionsInner = async (props: PropsInner) => {
	const [stage, actionInstances] = await Promise.all([
		getStage(props.stageId),
		getStageActions(props.stageId),
	]);

	if (stage === undefined) {
		return <SkeletonCard />;
	}

	const onAddAction = addAction.bind(null, stage.communityId, stage.id);
	const onDeleteAction = deleteAction.bind(null, stage.communityId);

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
						>
							<Suspense fallback={<SkeletonCard />}>
								<ActionConfigFormWrapper
									stage={stage}
									actionInstance={actionInstance}
									pageContext={props.pageContext}
								/>
							</Suspense>
						</StagePanelActionEditor>
					))}
				</div>
				<StagePanelActionCreator onAdd={onAddAction} isSuperAdmin={user?.isSuperAdmin} />
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
	pageContext: PageContext;
};

export const StagePanelActions = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelActionsInner stageId={props.stageId} pageContext={props.pageContext} />
		</Suspense>
	);
};
