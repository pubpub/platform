import { Fragment, Suspense } from "react";

import type { CommunitiesId } from "db/public";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { CommunityStage } from "~/lib/server/stages";
import type { StagesById, StagewithConstraints } from "~/lib/stages";
import type { MemberWithUser } from "~/lib/types";
import IntegrationActions from "~/app/components/IntegrationActions";
import PubRow from "~/app/components/PubRow";
import { getStageActions } from "~/lib/db/queries";
import { getPubs } from "~/lib/server";
import { getMembers } from "~/lib/server/member";
import { getCommunityStages } from "~/lib/server/stages";
import { getStageWorkflows, makeStagesById, moveConstraintSourcesForStage } from "~/lib/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubActions } from "./StagePubActions";

type Props = {
	token: string | Promise<string>;
	communityId: CommunitiesId;
	pageContext: PageContext;
};

export async function StageList(props: Props) {
	const [communityStages, communityMembers, token] = await Promise.all([
		getCommunityStages(props.communityId).execute(),
		getMembers({ communityId: props.communityId }).execute(),
		props.token,
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
							token={token}
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
	stage: CommunityStage;
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
					<IntegrationActions stageId={stage.id} token={token} type={"stage"} />
				</Suspense>
			</div>
			<Suspense fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} />}>
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

async function StagePubs({
	stage,
	token,
	stageById,
	pageContext,
	members,
}: {
	stage: StagewithConstraints;
	token: string;
	stageById: StagesById;
	pageContext: PageContext;
	members?: MemberWithUser[];
}) {
	const [stagePubs, actionInstances] = await Promise.all([
		getPubs(
			{ stageId: stage.id },
			{
				onlyParents: false,
				limit: 100,
			}
		),
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
