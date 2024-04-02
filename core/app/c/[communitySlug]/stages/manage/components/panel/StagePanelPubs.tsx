import { Suspense } from "react";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStagePubs } from "./queries";
import { Card, CardContent } from "ui/card";
import { Button } from "ui/button";

type PropsInner = {
	stageId: string;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const pubs = await getStagePubs(props.stageId);

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold mb-2 text-base">Pubs</h4>
				{pubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<span>A pub</span>
						<Button variant="ghost" size="sm">
							Run action
						</Button>
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
