import prisma from "~/prisma/db";
import StageManagement from "./StageManagement";
import { stageInclude } from "~/lib/types";

export default async function Page({ params }: { params: { communitySlug: string } }) {
	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});
	if (!community) {
		return null;
	}
	const stages = await prisma.stage.findMany({
		where: { communityId: community.id },
		include: stageInclude,
	});

	return (
		<>
			<h1>Workflow: {params.communitySlug}</h1>
			<StageManagement community={community} stages={stages} />
		</>
	);
}
