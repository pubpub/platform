import prisma from "~/prisma/db";
import StageList from "./StageList";
import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { stageInclude } from "~/lib/types";

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
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Stages</h1>
			<StageList stages={stages} token={token} loginData={loginData} />
		</>
	);
}
