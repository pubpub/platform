import type { CommunitiesId, StagesId, UsersId } from "db/public"

import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card"
import { ItemGroup } from "ui/item"

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import { getStage, getStageAutomations } from "~/lib/db/queries"
import { StagePanelAutomation } from "./StagePanelAutomation"
import { StagePanelAutomationForm } from "./StagePanelAutomationForm"

type PropsInner = {
	stageId: StagesId
	userId: UsersId
}

const StagePanelAutomationsInner = async (props: PropsInner) => {
	const [stage, automations] = await Promise.all([
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getStageAutomations(props.stageId).execute(),
	])

	if (!stage) {
		return <SkeletonCard />
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Automations</CardTitle>
					<StagePanelAutomationForm
						stageId={stage.id}
						communityId={stage.communityId as CommunitiesId}
						automations={automations}
					/>
				</div>
				<CardDescription>
					Automations are used to automate actions in a stage.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ItemGroup className="gap-y-2">
					{automations.length > 0 ? (
						automations.map((automation) => (
							<StagePanelAutomation
								stageId={stage.id}
								communityId={stage.communityId as CommunitiesId}
								automation={automation}
								key={automation.id}
							/>
						))
					) : (
						<div>
							There are no automations for <em>{stage.name}</em>
						</div>
					)}
				</ItemGroup>
			</CardContent>
		</Card>
	)
}

type Props = {
	stageId?: StagesId
	userId: UsersId
}

export const StagePanelAutomations = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelAutomationsInner stageId={props.stageId} userId={props.userId} />
		</Suspense>
	)
}
