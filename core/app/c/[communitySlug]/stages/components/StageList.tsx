import { Fragment, Suspense } from "react";
import Link from "next/link";

import type { CommunitiesId } from "db/public";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser } from "~/lib/types";
import PubRow from "~/app/components/PubRow";
import { getStageActions } from "~/lib/db/queries";
import { getPubs } from "~/lib/server";
import { selectCommunityMembers } from "~/lib/server/member";
import { getCommunityStages } from "~/lib/server/stages";
import { getStageWorkflows } from "~/lib/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubActions } from "./StagePubActions";

type Props = {
	communityId: CommunitiesId;
	pageContext: PageContext;
};

export async function StageList(props: Props) {
	const { communityId } = props;
	const [communityStages, communityMembers] = await Promise.all([
		getCommunityStages({ communityId }).execute(),
		selectCommunityMembers({ communityId }).execute(),
	]);

	const stageWorkflows = getStageWorkflows(communityStages);

	return (
		<div>
			{stageWorkflows.map((stages) => (
				<div key={stages[0].id}>
					{stages.map((stage) => (
						<StageCard
							key={stage.id}
							stage={stage}
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
	pageContext,
	members,
}: {
	stage: CommunityStage;
	members?: MemberWithUser[];
	pageContext: PageContext;
}) {
	return (
		<div key={stage.id} className="mb-20">
			<div className="flex flex-row justify-between">
				<Link href={`/c/${pageContext.params.communitySlug}/stages/${stage.id}`}>
					<h3 className="mb-2 text-lg font-semibold">{stage.name}</h3>
				</Link>
			</div>
			<Suspense
				fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} className="gap-16" />}
			>
				<StagePubs stage={stage} pageContext={pageContext} members={members} />
			</Suspense>
		</div>
	);
}

export async function StagePubs({
	stage,
	pageContext,
	members,
	limit,
}: {
	stage: CommunityStage;
	pageContext: PageContext;
	members?: MemberWithUser[];
	limit?: number;
}) {
	const [stagePubs, actionInstances] = await Promise.all([
		getPubs(
			{ stageId: stage.id },
			{
				onlyParents: false,
				limit,
			}
		),
		getStageActions(stage.id).execute(),
	]);

	return (
		<div className="flex flex-col gap-8">
			{stagePubs.map((pub, index, list) => {
				// this way we don't pass unecessary data to the client
				const { children, ...basePub } = pub;
				return (
					<Fragment key={pub.id}>
						<PubRow
							key={pub.id}
							pub={pub}
							actions={
								<StagePubActions
									key={stage.id}
									pub={basePub}
									stage={stage}
									actionInstances={actionInstances}
									pageContext={pageContext}
									members={members}
								/>
							}
							searchParams={pageContext.searchParams}
						/>
						{index < list.length - 1 && <hr />}
					</Fragment>
				);
			})}
		</div>
	);
}
