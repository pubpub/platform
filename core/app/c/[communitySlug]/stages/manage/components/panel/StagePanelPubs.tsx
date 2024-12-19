import { Suspense } from "react";

import type { PubsId, StagesId, UsersId } from "db/public";
import { Card, CardContent } from "ui/card";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubDropDown } from "~/app/components/pubs/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageActions, getStagePubs } from "~/lib/db/queries";

type PropsInner = {
	stageId: StagesId;
	pageContext: PageContext;
	userId: UsersId;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [stagePubs, stageActionInstances, stage] = await Promise.all([
		getStagePubs(props.stageId).execute(),
		getStageActions(props.stageId).execute(),
		getStage(props.stageId, props.userId).executeTakeFirst(),
	]);

	if (!stage) {
		throw new Error("Stage not found");
	}

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<div className="flex flex-wrap items-center justify-between">
					<h4 className="mb-2 text-base font-semibold">Pubs</h4>
					<Suspense fallback={<SkeletonCard />}>
						<CreatePubButton stageId={props.stageId as StagesId} />
					</Suspense>
				</div>
				{stagePubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<PubTitle pub={pub} />
						<div className="flex items-center gap-x-2">
							<PubsRunActionDropDownMenu
								actionInstances={stageActionInstances}
								pubId={pub.id as PubsId}
								stage={stage}
								pageContext={props.pageContext}
							/>
							<PubDropDown
								pubId={pub.id as PubsId}
								searchParams={props.pageContext.searchParams}
							/>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
};

type Props = {
	stageId?: StagesId;
	pageContext: PageContext;
	userId: UsersId;
};

export const StagePanelPubs = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelPubsInner
				stageId={props.stageId}
				pageContext={props.pageContext}
				userId={props.userId}
			/>
		</Suspense>
	);
};
