import type { Metadata } from "next";

import { cache, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunitiesId, StagesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Button } from "ui/button";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { getStages } from "~/lib/server/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubs } from "../components/StageList";

const getStageCached = cache(async (stageId: StagesId, communityId: CommunitiesId) => {
	return getStages({ stageId, communityId }).executeTakeFirst();
});

export async function generateMetadata({
	params: { stageId, communitySlug },
}: {
	params: { stageId: StagesId; communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		notFound();
	}
	const stage = await getStageCached(stageId, community.id);
	if (!stage) {
		notFound();
	}

	return { title: `${stage.name} Stage` };
}

export default async function Page({
	params,
	searchParams,
}: {
	searchParams: Record<string, string> & { page?: string };

	params: { communitySlug: string; stageId: StagesId };
}) {
	const { communitySlug, stageId } = params;
	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!community) {
		notFound();
	}

	const page = searchParams.page ? parseInt(searchParams.page) : 1;

	const stagePromise = getStageCached(stageId, community.id);
	const capabilityPromise = userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);
	const [stage, showEditButton] = await Promise.all([stagePromise, capabilityPromise]);

	if (!stage) {
		notFound();
	}

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">{stage.name}</h1>
				<div className="flex gap-2">
					{showEditButton && (
						<Button variant="outline" size="sm" asChild>
							<Link href={`./manage?editingStageId=${stageId}`}>
								Edit Stage Settings
							</Link>
						</Button>
					)}
					<CreatePubButton
						text="Create Pub"
						stageId={stageId}
						communityId={community.id}
					/>
				</div>
			</div>
			<Suspense
				fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} className="gap-16" />}
			>
				<StagePubs
					userId={user.id}
					stage={stage}
					pageContext={{
						params,
						searchParams,
					}}
					pagination={{ page, pubsPerPage: 10 }}
					basePath={""}
				/>
			</Suspense>
		</>
	);
}
