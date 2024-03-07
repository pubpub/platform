import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { StageEditor } from "./StageEditor";
import { StageEditorProvider } from "./StageEditorContext";
import { unstable_cache } from "next/cache";

export default async function Page({ params }: { params: { communitySlug: string } }) {
	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});

	if (!community) {
		return null;
	}

	const getCommunityStages = unstable_cache(
		(communityId: string) =>
			prisma.stage.findMany({
				where: { communityId },
				include: stageInclude,
			}),
		undefined,
		{ tags: [`community-stages_${community.id}`] }
	);

	const stages = await getCommunityStages(community.id);

	return (
		<StageEditorProvider stages={stages} communityId={community.id}>
			<StageEditor />
		</StageEditorProvider>
	);
}
