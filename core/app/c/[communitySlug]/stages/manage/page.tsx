import prisma from "~/prisma/db";
import StageManagement from "./StageManagement";
import { stageInclude } from "~/lib/types";
import { topologicallySortedStages } from "~/lib/stages";

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
	// stage workflows look like this:  [[stage1, stage2], [stage3, stage4]]
	const { stageWorkflows, stageAtIndex } = topologicallySortedStages(stages);
	return (
		<>
			<h1>
				Stages in <strong>{params.communitySlug}</strong>
			</h1>
			<StageManagement
				community={community}
				stageWorkflows={stageWorkflows}
				stageAtIndex={stageAtIndex}
			/>
		</>
	);
}
