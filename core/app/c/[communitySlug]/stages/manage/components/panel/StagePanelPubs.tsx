import { Suspense } from "react";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { PubDropDown } from "~/app/components/PubCRUD/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageActions, getStagePubs } from "./queries";
import { StagePanelPubsRunActionButton } from "./StagePanelPubsRunActionButton";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const stagePubs = await getStagePubs(props.stageId);
	const stageActions = await getStageActions(props.stageId);

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
											actionInstance={action}
											pub={pub}
										/>
									))}
								</PopoverContent>
							</Popover>
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
