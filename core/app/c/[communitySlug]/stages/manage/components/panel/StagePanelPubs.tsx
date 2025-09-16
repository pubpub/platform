import assert from "assert";

import { Suspense } from "react";
import Link from "next/link";

import type { PubsId, StagesId, UsersId } from "db/public";
import { Card, CardContent } from "ui/card";

import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubCard } from "~/app/components/pubs/PubCard/PubCard";
import { PubDropDown } from "~/app/components/pubs/PubDropDown";
import { PubTitle } from "~/app/components/PubTitle";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getLoginData, getPageLoginData } from "~/lib/authentication/loginData";
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities";
import { getStage, getStageActions, getStagePubs } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { getStages } from "~/lib/server/stages";
import { getStagesCached } from "../../queries";

type PropsInner = {
	stageId: StagesId;
	searchParams: Record<string, unknown>;
	userId: UsersId;
};

const StagePanelPubsInner = async (props: PropsInner) => {
	const [community] = await Promise.all([findCommunityBySlug()]);

	assert(community, "Community not found");

	const [
		stagePubs,
		stage,
		canArchiveAllPubs,
		canEditAllPubs,
		canRunActionsAllPubs,
		canMoveAllPubs,
		canViewAllStages,
	] = await Promise.all([
		getPubsWithRelatedValues(
			{ stageId: [props.stageId], communityId: community.id },
			{
				withStage: true,
				withStageActionInstances: true,
				withPubType: true,
				withValues: true,
				withRelatedPubs: false,
			}
		),
		getStage(props.stageId, props.userId).executeTakeFirst(),
		userCanArchiveAllPubs(),
		userCanEditAllPubs(),
		userCanRunActionsAllPubs(),
		userCanMoveAllPubs(),
		userCanViewAllStages(),
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
					<PubCard
						key={pub.id}
						pub={{ ...pub, stageId: props.stageId, depth: 0 }}
						communitySlug={community.slug}
						userId={props.userId}
						actionInstances={pub.stage?.actionInstances ?? []}
						canArchiveAllPubs={canArchiveAllPubs}
						canEditAllPubs={canEditAllPubs}
						canRunActionsAllPubs={canRunActionsAllPubs}
						canMoveAllPubs={canMoveAllPubs}
						canViewAllStages={canViewAllStages}
						moveFrom={stage.moveConstraintSources}
						moveTo={stage.moveConstraints}
						canFilter={false}
					/>
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
