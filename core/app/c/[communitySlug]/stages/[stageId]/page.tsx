import { Suspense } from "react";

import type { StagesId } from "db/public";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { getCommunityStages } from "~/lib/server/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubs } from "../components/StageList";

export default async function Page({
	params,
	searchParams,
}: {
	searchParams: Record<string, string>;

	params: { communitySlug: string; stageId: StagesId };
}) {
	const { communitySlug, stageId } = params;
	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	const stage = await getCommunityStages({ stageId }).executeTakeFirstOrThrow();

	return (
		<>
			<Suspense
				fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} className="gap-16" />}
			>
				<StagePubs
					stage={stage}
					pageContext={{
						params,
						searchParams,
					}}
					limit={10}
				/>
			</Suspense>
		</>
	);
}
