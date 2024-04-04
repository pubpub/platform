import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageActions, getStagePubs } from "./queries";
import { Card, CardContent } from "ui/card";
import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import * as actions from "../../actions";
import { getActionByName, getActionRunFunctionByName } from "~/actions";
import { Play } from "ui/icon";
import { StagePanelPubsRunActionButton } from "./StagePanelPubsrunActionButton";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const stagePubs = await getStagePubs(props.stageId);
	const stageActions = await getStageActions(props.stageId);

	const actions = stageActions.map((action) => ({
		...action,
		// run: getActionRunFunctionByName(action.action.name),
	}));

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold mb-2 text-base">Pubs</h4>
				{stagePubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<span>A pub</span>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="secondary" size="sm">
									Run action
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								{actions.map((action) => (
									<StagePanelPubsRunActionButton
										key={action.id}
										action={action}
										pub={pub}
									/>
								))}
							</PopoverContent>
						</Popover>
					</div>
				))}
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: string;
};

export const StagePanelPubs = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelPubsInner stageId={props.stageId} />
		</Suspense>
	);
};
