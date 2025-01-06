import { Suspense } from "react";
import Link from "next/link";

import type { PubsId, StagesId } from "db/public";
import { Card, CardContent } from "ui/card";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubDropDown } from "~/app/components/pubs/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageActions, getStagePubs } from "~/lib/db/queries";
import { pubPath } from "~/lib/paths";

type PropsInner = {
	stageId: StagesId;
	pageContext: PageContext;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [stagePubs, stageActionInstances, stage] = await Promise.all([
		getStagePubs(props.stageId).execute(),
		getStageActions(props.stageId).execute(),
		getStage(props.stageId).executeTakeFirst(),
	]);

	if (!stage) {
		throw new Error("Stage not found");
	}

	if (!props.pageContext.params.communitySlug) {
		throw new Error("No community slug passed to StagePanelPubs through pageContext");
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
						<Link
							href={pubPath(props.pageContext.params.communitySlug, pub.slug)}
							className="hover:underline"
						>
							<PubTitle pub={pub} />
						</Link>
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
