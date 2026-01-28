import type { StagesId, UsersId } from "db/public"

import { Suspense } from "react"
import assert from "node:assert"
import { BookOpen } from "lucide-react"

import { AutomationEvent } from "db/public"
import { Card, CardAction, CardContent, CardTitle } from "ui/card"

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { PubCardServer } from "~/app/components/pubs/PubCard/PubCardServer"
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
import { StagePanelCardHeader } from "../editor/StagePanelCard"

type Props = {
	stageId: StagesId
	searchParams: Record<string, unknown>
	userId: UsersId
}

export const StagePanelPubs = async (props: Props) => {
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
			communityId: community.id,
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
		<Card className="h-full">
			<StagePanelCardHeader>
				<div className="flex items-center gap-2">
					<BookOpen size={16} />
					<CardTitle>Pubs </CardTitle>
				</div>
				<CardAction>
					<Suspense fallback={<SkeletonCard />}>
						<CreatePubButton
							stageId={props.stageId}
							className="!bg-transparent m-0 h-6 border-none p-0 text-muted-foreground text-xs shadow-none hover:bg-transparent hover:text-foreground"
						/>
					</Suspense>
				</CardAction>
			</StagePanelCardHeader>
			<CardContent>
				<div className="flex flex-col gap-2 dark:[&>div]:bg-muted/50">
					{stagePubs.map((pub) => (
						<PubCardServer
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
