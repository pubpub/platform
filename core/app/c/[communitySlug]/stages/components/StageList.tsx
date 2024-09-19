import { Fragment, Suspense } from "react";
import Link from "next/link";

import type { CommunitiesId, MoveConstraint, StagesId } from "db/public";
import { Button } from "ui/button";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { StagesById, StageThingy } from "~/lib/stages";
import type { MemberWithUser } from "~/lib/types";
import PubRow from "~/app/components/PubRow";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStageActions } from "~/lib/db/queries";
import { getPubs } from "~/lib/server";
import { getMembers } from "~/lib/server/member";
import { getCommunityStages, getIntegrationInstancesForStage } from "~/lib/server/stages";
import { getStageWorkflows, makeStagesById, moveConstraintSourcesForStage } from "~/lib/stages";
import { StagePubActions } from "./StagePubActions";

type Props = {
	token: string;
	communityId: CommunitiesId;
	pageContext: PageContext;
};
type IntegrationAction = { text: string; href: string; kind?: "stage" };

export async function StageList(props: Props) {
	const [communityStages, communityMembers] = await Promise.all([
		getCommunityStages(props.communityId).execute(),
		getMembers({ communityId: props.communityId }).execute(),
	]);

	const stageWorkflows = getStageWorkflows(communityStages);
	const stageById = makeStagesById(communityStages);

	return (
		<div>
			{stageWorkflows.map((stages) => (
				<div key={stages[0].id}>
					{stages.map((stage) => (
						<StageCard
							key={stage.id}
							stage={stage}
							stageById={stageById}
							token={props.token}
							members={communityMembers}
							pageContext={props.pageContext}
						/>
					))}
				</div>
			))}
		</div>
	);
}

async function StageCard({
	stage,
	stageById,
	token,
	pageContext,
	members,
}: {
	stage: {
		name: string;
		id: StagesId;
		communityId: CommunitiesId;
		createdAt: Date;
		updatedAt: Date;
		order: string;
	} & {
		moveConstraints: MoveConstraint[];
		moveConstraintSources: MoveConstraint[];
	};
	stageById: StagesById;
	token: string;
	members?: MemberWithUser[];
	pageContext: PageContext;
}) {
	return (
		<div key={stage.id} className="mb-20">
			<div className="flex flex-row justify-between">
				<h3 className="mb-2 text-lg font-semibold">{stage.name}</h3>
				<Suspense>
					<IntegrationActions stage={stage} token={token} />
				</Suspense>
			</div>
			<Suspense fallback={<SkeletonCard />}>
				<StagePubs
					stage={stage}
					token={token}
					stageById={stageById}
					pageContext={pageContext}
					members={members}
				/>
			</Suspense>
		</div>
	);
}

async function IntegrationActions({ stage, token }: { stage: StageThingy; token: string }) {
	const integrationInstances = await getIntegrationInstancesForStage(stage.id).execute();
	return integrationInstances.map((instance) => {
		if (!Array.isArray(instance.integration.actions)) {
			return null;
		}
		return (
			<Fragment key={instance.id}>
				{instance.integration.actions?.map((action: IntegrationAction) => {
					if (action.kind === "stage") {
						const href = new URL(action.href);
						href.searchParams.set("instanceId", instance.id);
						href.searchParams.set("token", token);
						return (
							<Button key={action.text} variant="outline" size="sm" asChild>
								<Link href={href.toString()}>{action.text}</Link>
							</Button>
						);
					}
					return null;
				})}
			</Fragment>
		);
	});
}

async function StagePubs({
	stage,
	token,
	stageById,
	pageContext,
	members,
}: {
	stage: StageThingy;
	token: string;
	stageById: StagesById;
	pageContext: PageContext;
	members?: MemberWithUser[];
}) {
	const [stagePubs, actionInstances] = await Promise.all([
		getPubs({ stageId: stage.id }),
		getStageActions(stage.id).execute(),
	]);

	const sources = moveConstraintSourcesForStage(stage, stageById);
	const destinations = stage.moveConstraints.map((stage) => stageById[stage.destinationId]);

	return (
		<div className="flex flex-col gap-9">
			{stagePubs.map((pub, index, list) => {
				// this way we don't pass unecessary data to the client
				const { children, ...basePub } = pub;
				return (
					<Fragment key={pub.id}>
						<PubRow
							key={pub.id}
							pub={pub}
							token={token}
							actions={
								<StagePubActions
									key={stage.id}
									moveFrom={sources}
									moveTo={destinations}
									pub={basePub}
									stage={stage}
									actionInstances={actionInstances}
									pageContext={pageContext}
									members={members}
								/>
							}
						/>
						{index < list.length - 1 && <hr />}
					</Fragment>
				);
			})}
		</div>
	);
}
