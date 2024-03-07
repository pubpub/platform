import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { StageEditor } from "./StageEditor";
import { StageEditorProvider } from "./StageEditorContext";

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
		<StageEditorProvider stages={stages} communityId={community.id}>
			<StageEditor />
		</StageEditorProvider>
	);
}
