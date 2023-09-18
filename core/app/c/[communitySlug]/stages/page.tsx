import { unstable_cache } from "next/cache";
import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import StageList from "./components/StageList";

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

const getCachedCommunityStages = async (communitySlug: string) => {
	const data = unstable_cache(
		async () => {
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
		},
		["cache-key"],
		{
			tags: ["stages"],
			revalidate: 24,
		}
	);
	return data();
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	// const stages = await getCommunityStages(params.communitySlug);
	const stages = await getCachedCommunityStages(params.communitySlug);
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
