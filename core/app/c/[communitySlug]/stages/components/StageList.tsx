import type { User as LuciaUser } from "lucia";

import { Fragment, Suspense } from "react";
import Link from "next/link";

import type { CommunitiesId, MoveConstraint, StagesId } from "db/public";
import { UsersId } from "db/public";
import { Button } from "ui/button";

import type {
	CommunityMemberPayload,
	StagePayload,
} from "~/lib/server/_legacy-integration-queries";
import type { StagesById, StageThingy } from "~/lib/stages";
import PubRow from "~/app/components/PubRow";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getStagePubs } from "~/lib/db/queries";
import { getPubUsers } from "~/lib/permissions";
import { getCommunityStages, getIntegrationInstancesForStage } from "~/lib/server/stages";
import { getStageWorkflows, makeStagesById, moveConstraintSourcesForStage } from "~/lib/stages";
import { StagePubActions } from "./StagePubActions";

type Props = {
	token: string;
	communityId: CommunitiesId;
};
type IntegrationAction = { text: string; href: string; kind?: "stage" };

export async function StageList(props: Props) {
	const communityStages = await getCommunityStages(props.communityId).execute();

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
}) {
	// const users = getPubUsers(stage.permissions);
	// users should be just member but these are users
	return (
		<div key={stage.id} className="mb-20">
			<div className="flex flex-row justify-between">
				<h3 className="mb-2 text-lg font-semibold">{stage.name}</h3>
				<Suspense>
					<IntegrationActions stage={stage} token={token} />
				</Suspense>
			</div>
			<Suspense fallback={<SkeletonCard />}>
				<StagePubs stage={stage} token={token} stageById={stageById} />
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
}: {
	stage: StageThingy;
	token: string;
	stageById: StagesById;
}) {
	const stagePubs = await getStagePubs(stage.id).execute();

	const sources = moveConstraintSourcesForStage(stage, stageById);
	const destinations = stage.moveConstraints.map((stage) => stageById[stage.destinationId]);
	return (
		<div className="flex flex-col gap-9">
			{stagePubs.map((pub, index, list) => {
				return (
					<Suspense
						fallback={
							<div className="flex flex-row items-center justify-center">
								Loading...
							</div>
						}
						key={pub.id}
					>
						<Fragment>
							<PubRow
								key={pub.id}
								pubId={pub.id}
								token={token}
								actions={
									<StagePubActions
										key={stage.id}
										moveFrom={sources}
										moveTo={destinations}
										pub={pub}
										stage={stage}
									/>
								}
							/>
							{index < list.length - 1 && <hr />}
						</Fragment>
					</Suspense>
				);
			})}
		</div>
	);
}
