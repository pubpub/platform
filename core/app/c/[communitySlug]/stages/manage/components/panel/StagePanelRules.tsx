import { Suspense } from "react";

import type { CommunitiesId } from "db/public/Communities";
import { Card, CardContent } from "ui/card";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStage, getStageActions, getStageRules } from "~/lib/db/queries";
import { StagePanelRule } from "./StagePanelRule";
import { StagePanelRuleCreator } from "./StagePanelRuleCreator";

type PropsInner = {
	stageId: string;
};

const StagePanelRulesInner = async (props: PropsInner) => {
	const stage = await getStage(props.stageId);
	if (!stage) {
		return <SkeletonCard />;
	}

	const rules = await getStageRules(props.stageId);
	const actionInstances = await getStageActions(props.stageId);

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
	);
};

type Props = {
	stageId?: string;
};

export const StagePanelRules = async (props: Props) => {
	if (props.stageId === undefined) {
		return <SkeletonCard />;
	}

	return (
		<Suspense fallback={<SkeletonCard />}>
			<StagePanelRulesInner stageId={props.stageId} />
		</Suspense>
	);
};
