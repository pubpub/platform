import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import StageList from "./StageList";

export type StagesData = Prisma.PromiseReturnType<typeof getCommunityStages>;

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
		include: {
			pubs: {
				include: {
					pubType: true,
					values: { include: { field: true } },
					stages: {
						include: {
							integrationInstances: { include: { integration: true } },
						},
					},
					integrationInstances: { include: { integration: true } },
				},
			},
			integrationInstances: { include: { integration: true } },
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const stages = await getCommunityStages(params.communitySlug);
	if (!stages) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Stages</h1>
			<StageList stages={stages} />
		</>
	);
}
