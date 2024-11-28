import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { StagesId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";
import { getCommunityStages } from "~/lib/server/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubs } from "../components/StageList";

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

	const stage = await getCommunityStages({ stageId }).executeTakeFirstOrThrow();
	const page = searchParams.page ? parseInt(searchParams.page) : 1;

	const showEditButton = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

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
						searchParams={searchParams}
					/>
				</div>
			</div>
			<Suspense
				fallback={<PubListSkeleton amount={stage.pubsCount ?? 2} className="gap-16" />}
			>
				<StagePubs
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