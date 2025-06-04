import { Suspense } from "react";
import Link from "next/link";

import type { PubsId, StagesId, UsersId } from "db/public";
import { Card, CardContent } from "ui/card";

import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubDropDown } from "~/app/components/pubs/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageActions, getStagePubs } from "~/lib/db/queries";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";

type PropsInner = {
	stageId: StagesId;
	searchParams: Record<string, unknown>;
	userId: UsersId;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [communitySlug, stagePubs, stageActionInstances, stage] = await Promise.all([
		getCommunitySlug(),
		getStagePubs(props.stageId).execute(),
		getStageActions({ stageId: props.stageId }).execute(),
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
						<CreatePubButton stageId={props.stageId} />
					</Suspense>
				</div>
				{stagePubs.map((pub) => (
					<div key={pub.id} className="flex items-center justify-between">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className="hover:underline"
						>
							<PubTitle pub={pub} />
						</Link>
						<div className="flex items-center gap-x-2">
							<PubsRunActionDropDownMenu
								actionInstances={stageActionInstances}
								pubId={pub.id as PubsId}
								stage={stage}
							/>
							<PubDropDown
								pubId={pub.id as PubsId}
								searchParams={props.searchParams}
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
	searchParams: Record<string, unknown>;
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
				searchParams={props.searchParams}
				userId={props.userId}
			/>
		</Suspense>
	);
};
