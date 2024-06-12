import { Suspense } from "react";

import { Card, CardContent } from "ui/card";

import type { StagesId } from "~/kysely/types/public/Stages";
import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageActions, getStagePubs } from "./queries";
import {
	PageContext,
	StagePanelPubsRunActionDropDownMenu,
} from "./StagePanelPubsRunActionDropDownMenu";

type PropsInner = {
	stageId: string;
	pageContext: PageContext;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [stagePubs, stageActionInstances, stage] = await Promise.all([
		getStagePubs(props.stageId),
		getStageActions(props.stageId),
		getStage(props.stageId),
	]);

	if (!stage) {
		throw new Error("Stage not found");
	}

const StagePanelPubsInner = async (props: { stageId: StagesId }) => {
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
								actionInstances={stageActionInstances}
								pub={pub}
								stage={stage}
								pageContext={props.pageContext}
							/>
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
	pageContext: PageContext;
};

export const StagePanelPubs = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelPubsInner stageId={props.stageId} pageContext={props.pageContext} />
		</Suspense>
	);
};
