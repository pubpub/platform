import assert from "node:assert";

import { Suspense } from "react";

import type { StagesId, UsersId } from "db/public";
import { AutomationEvent } from "db/public";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "ui/card";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubCard } from "~/app/components/pubs/PubCard/PubCard";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities";
import { getStage, getStageAutomations } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { StagePanelCardHeader } from "../editor/StagePanelCard";

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
		manualAutomations,
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
				withPubType: true,
				withValues: true,
				withRelatedPubs: false,
			}
		),
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageAutomations(props.stageId, {
			event: AutomationEvent.manual,
		}),
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
			<StagePanelCardHeader>
				<CardTitle>Pubs </CardTitle>
				<CardAction>
					<Suspense fallback={<SkeletonCard />}>
						<CreatePubButton
							stageId={props.stageId}
							className="m-0 h-6 border-none bg-transparent p-0 text-xs text-neutral-600 shadow-none hover:bg-transparent hover:text-neutral-900"
						/>
					</Suspense>
				</CardAction>
			</StagePanelCardHeader>
			<CardContent>
				<div className="flex flex-col gap-2">
					{stagePubs.map((pub) => (
						<PubCard
							key={pub.id}
							pub={{ ...pub, stageId: props.stageId, depth: 0 }}
							communitySlug={community.slug}
							userId={props.userId}
							manualAutomations={manualAutomations}
							canArchiveAllPubs={canArchiveAllPubs}
							canEditAllPubs={canEditAllPubs}
							canRunActionsAllPubs={canRunActionsAllPubs}
							canMoveAllPubs={canMoveAllPubs}
							canViewAllStages={canViewAllStages}
							moveFrom={stage.moveConstraintSources}
							moveTo={stage.moveConstraints}
							canFilter={false}
							withSelection={false}
						/>
					))}
				</div>
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
