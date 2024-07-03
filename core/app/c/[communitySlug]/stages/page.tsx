import { notFound } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityBySlug } from "~/lib/db/queries";
import { createToken } from "~/lib/server/token";
import { getStageWorkflows, makeStagesById } from "~/lib/stages";
import StageList from "./components/StageList";

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	const community = await getCommunityBySlug(params.communitySlug);
	if (!community) {
		notFound();
	}
	const token = await createToken(loginData.id);
	const stageWorkflows = getStageWorkflows(community.stages);

	const stageById = makeStagesById(community.stages);

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
			</div>
			<StageList
				members={community.members}
				stageWorkflows={stageWorkflows}
				stageById={stageById}
				token={token}
				loginData={loginData}
			/>
		</>
	);
}
