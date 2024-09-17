import type { Metadata } from "next";

import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { getPageLoginData } from "~/lib/auth/loginData";
import { getCommunityBySlug } from "~/lib/db/queries";
import { findCommunityBySlug } from "~/lib/server/community";
import { getCommunityStages } from "~/lib/server/stages";
import { createToken } from "~/lib/server/token";
import { getStageWorkflows, makeStagesById } from "~/lib/stages";
import { StageList } from "./components/StageList";

export const metadata: Metadata = {
	title: "Workflows",
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		notFound();
	}

	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
			</div>
			<Suspense fallback={<SkeletonCard />}>
				<StageList token={token} communityId={community.id} />
			</Suspense>
		</>
	);
}
