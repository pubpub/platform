import { Suspense } from "react";

import type { StagesId, UsersId } from "db/public";
import { Card, CardContent } from "ui/card";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { ActionRunNotifierProvider } from "~/app/c/[communitySlug]/Notifier";
import { ActionConfigFormWrapper } from "~/app/components/ActionUI/ActionConfigFormWrapper";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getLoginData } from "~/lib/authentication/loginData";
import { getStage, getStageActions } from "~/lib/db/queries";
import { addAction, deleteAction } from "../../../actions";
import { StagePanelActionCreator } from "./StagePanelActionCreator";
import { StagePanelActionEditor } from "./StagePanelActionEditor";

type PropsInner = {
	stageId: StagesId;
	pageContext: PageContext;
	userId: UsersId;
};

const StagePanelActionsInner = async (props: PropsInner) => {
	const [stage, actionInstances] = await Promise.all([
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageActions(props.stageId).execute(),
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
					{/* <ActionRunNotifierProvider> */}
					{actionInstances.map((actionInstance) => (
						<StagePanelActionEditor
							key={actionInstance.id}
							actionInstance={actionInstance}
							onDelete={onDeleteAction}
							communityId={stage.communityId}
							stageId={props.stageId}
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
					{/* </ActionRunNotifierProvider> */}
				</div>
				<StagePanelActionCreator onAdd={onAddAction} isSuperAdmin={user?.isSuperAdmin} />
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	pageContext: PageContext;
	userId: UsersId;
};

export const StagePanelActions = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelActionsInner
				stageId={props.stageId}
				pageContext={props.pageContext}
				userId={props.userId}
			/>
		</Suspense>
	);
};
