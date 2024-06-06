import { Suspense } from "react";

import { Card, CardContent } from "ui/card";

import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { PubDropDown } from "~/app/components/PubCRUD/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { ActionRunFormContextWrapper } from "./ActionRunFormContextWrapper";
import { getStage, getStageActions, getStagePubs } from "./queries";
import { StagePanelPubsRunActionDropDownMenu } from "./StagePanelPubsRunActionDropDownMenu";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [stagePubs, stageActions] = await Promise.all([
		getStagePubs(props.stageId),
		getStageActions(props.stageId),
		getStage(props.stageId),
	]);

	const actions = stageActions.map((action) => ({
		...action,
	}));

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<div className="flex flex-wrap items-center justify-between">
					<h4 className="mb-2 text-base font-semibold">Pubs</h4>
					<Suspense fallback={<SkeletonCard />}>
						<PubCreateButton stageId={props.stageId as StagesId} />
					</Suspense>
				</div>
				{stagePubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<PubTitle pub={pub} />
						<div className="flex items-center gap-x-2">
							<StagePanelPubsRunActionDropDownMenu
								actionInstances={actions}
								pub={pub}
								stage={props.stage}
							>
								{/* <ActionRunFormContextWrapper
									stage={props.stage}
									pub={pub}
									actionInstance={props.actionInstance}
								/> */}
							</StagePanelPubsRunActionDropDownMenu>
							<PubDropDown pubId={pub.id as PubsId} />
						</div>
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
