import type { Metadata } from "next";

import { notFound } from "next/navigation";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { getPageLoginData } from "~/lib/auth/loginData";
import { getCommunityBySlug } from "~/lib/db/queries";
import { createToken } from "~/lib/server/token";
import { getStageWorkflows } from "~/lib/stages";
import StageList from "./components/StageList";

export const metadata: Metadata = {
	title: "Workflows",
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const { user } = await getPageLoginData();
	const community = await getCommunityBySlug(params.communitySlug);
	if (!community) {
		notFound();
	}
	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});
	const stageWorkflows = getStageWorkflows(community.stages);

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
			</div>
			<StageList
				members={community.members}
				stageWorkflows={stageWorkflows}
				token={token}
				communityStages={community.stages}
			/>
		</>
	);
}
