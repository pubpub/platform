import type { StagesId, UsersId } from "db/public"

import { Suspense } from "react"
import assert from "node:assert"

import { AutomationEvent } from "db/public"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "ui/card"

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { PubCard } from "~/app/components/pubs/PubCard/PubCard"
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities"
import { getStage, getStageAutomations } from "~/lib/db/queries"
import { getPubsWithRelatedValues } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"

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
				withStageActionInstances: true,
				withPubType: true,
				withValues: true,
				withRelatedPubs: false,
			}
		),
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageAutomations(props.stageId, { event: AutomationEvent.manual }).execute(),
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
			<CardHeader className="flex flex-wrap items-center justify-between">
				<CardTitle>Pubs</CardTitle>

				<CardAction>
					<Suspense fallback={<SkeletonCard />}>
						<CreatePubButton stageId={props.stageId} />
					</Suspense>
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-2 p-4">
				{stagePubs.map((pub) => (
					<PubCard
						key={pub.id}
						pub={{ ...pub, stageId: props.stageId, depth: 0 }}
						communitySlug={community.slug}
						userId={props.userId}
						// actionInstances={pub.stage?.actionInstances ?? []}
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
