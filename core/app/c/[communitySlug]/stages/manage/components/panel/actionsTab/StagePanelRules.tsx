import { Suspense } from "react"

import type { CommunitiesId, StagesId } from "db/public"
import { Card, CardContent } from "ui/card"

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import { getStage, getStageActions, getStageRules } from "~/lib/db/queries"
import { StagePanelRule } from "./StagePanelRule"
import { StagePanelRuleCreator } from "./StagePanelRuleCreator"

type PropsInner = {
	stageId: StagesId
}

const StagePanelRulesInner = async (props: PropsInner) => {
	const [stage, actionInstances, rules] = await Promise.all([
		getStage(props.stageId).executeTakeFirst(),
		getStageActions(props.stageId).execute(),
		getStageRules(props.stageId).execute(),
	])
	if (!stage) {
		return <SkeletonCard />
	}

	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="mb-2 text-base font-semibold">Rules</h4>
				{actionInstances.length > 0 ? (
					<>
						<div className="flex flex-col gap-2">
							{rules.length > 0 ? (
								<>
									{rules.map((rule) => (
										<StagePanelRule
											stageId={stage.id}
											communityId={stage.communityId as CommunitiesId}
											rule={rule}
											key={rule.id}
										/>
									))}
								</>
							) : (
								<div>
									There are no rules for <em>{stage.name}</em>
								</div>
							)}
						</div>
						<StagePanelRuleCreator
							stageId={stage.id}
							actionInstances={actionInstances}
							communityId={stage.communityId}
							rules={rules}
						/>
					</>
				) : (
					<div>
						There are no actions for <em>{stage.name}</em>. Once you add an action to
						this stage you can add rules to it here.
					</div>
				)}
			</CardContent>
		</Card>
	)
}

type Props = {
	stageId?: StagesId
}

export const StagePanelRules = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelRulesInner stageId={props.stageId} />
		</Suspense>
	)
}
