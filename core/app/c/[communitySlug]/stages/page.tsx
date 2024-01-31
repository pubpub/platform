import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import StageList from "./components/StageList";
import { getStageWorkflows, makeStagesById } from "~/lib/stages";

const getCommunityStages = async (communitySlug: string) => {
	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});
	if (!community) {
		return null;
	}
	// When trying to render the workflows a member can see. We look at the pubs they can see, get the workflows associated, and then show all those.
	return await prisma.stage.findMany({
		where: { communityId: community.id },
		include: stageInclude,
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	const stages = await getCommunityStages(params.communitySlug);
	if (!stages) {
		return null;
	}
	const stageWorkflows = getStageWorkflows(stages);
	const stageIndex = makeStagesById(stages);
	return (
		<>
			<div className="flex mb-16 justify-between items-center">
				<h1 className="font-bold text-xl">Stages</h1> -{" "}
				{/* <Link href="stages/dashboard">Manage Stages</Link> */}
			</div>
			<StageList
				stageWorkflows={stageWorkflows}
				stageIndex={stageIndex}
				token={token}
				loginData={loginData}
			/>
		</>
	);
}
