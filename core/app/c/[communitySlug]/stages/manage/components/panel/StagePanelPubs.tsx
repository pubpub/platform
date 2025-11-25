<<<<<<< HEAD
import assert from "node:assert";
=======
import type { StagesId, UsersId } from "db/public"
>>>>>>> main

import { Suspense } from "react"
import assert from "node:assert"

<<<<<<< HEAD
import type { StagesId, UsersId } from "db/public";
import { AutomationEvent } from "db/public";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "ui/card";
=======
import { Card, CardContent } from "ui/card"
>>>>>>> main

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { PubCard } from "~/app/components/pubs/PubCard/PubCard"
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
<<<<<<< HEAD
} from "~/lib/authorization/capabilities";
import { getStage, getStageAutomations } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { StagePanelCardHeader } from "../editor/StagePanelCard";
=======
} from "~/lib/authorization/capabilities"
import { getStage } from "~/lib/db/queries"
import { getPubsWithRelatedValues } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"
>>>>>>> main

type PropsInner = {
	stageId: StagesId
	searchParams: Record<string, unknown>
	userId: UsersId
}

const StagePanelPubsInner = async (props: PropsInner) => {
	const [community] = await Promise.all([findCommunityBySlug()])

	assert(community, "Community not found")

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
	])

	if (!stage) {
		throw new Error("Stage not found")
	}

	return (
		<Card>
<<<<<<< HEAD
			<StagePanelCardHeader>
				<CardTitle>Pubs </CardTitle>
				<CardAction>
=======
			<CardContent className="space-y-2 p-4">
				<div className="flex flex-wrap items-center justify-between">
					<h4 className="mb-2 font-semibold text-base">Pubs</h4>
>>>>>>> main
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
	)
}

type Props = {
	stageId?: StagesId
	searchParams: Record<string, unknown>
	userId: UsersId
}

export const StagePanelPubs = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelPubsInner
				stageId={props.stageId}
				searchParams={props.searchParams}
				userId={props.userId}
			/>
		</Suspense>
	)
}
