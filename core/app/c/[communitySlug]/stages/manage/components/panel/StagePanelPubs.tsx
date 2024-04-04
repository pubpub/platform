import { Suspense } from "react";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageActions, getStagePubs } from "./queries";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const stagePubs = await getStagePubs(props.stageId);
	const stageActions = await getStageActions(props.stageId);

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="mb-2 text-base font-semibold">Pubs</h4>
				{stagePubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<span>A pub</span>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm">
									Run action
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								{stageActions.map((action) => (
									<Button key={action.id} variant="ghost" size="sm">
										{action.action.name}
									</Button>
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
