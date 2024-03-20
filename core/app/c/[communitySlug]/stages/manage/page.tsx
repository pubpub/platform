import { unstable_cache } from "next/cache";
import "reactflow/dist/style.css";
import { LocalStorageProvider } from "ui/hooks";
import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { StageEditor } from "./StageEditor";
import { StageEditorProvider } from "./StageEditorContext";
import { StageEditorPanel } from "./StageEditorPanel";
import { StagesProvider } from "./StagesContext";

type Props = {
	params: { communitySlug: string };
	searchParams: {
		editingStageId: string | undefined;
	};
};

export default async function Page({ params, searchParams }: Props) {
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
	const actions = await prisma.action.findMany();

	return (
		<StagesProvider actions={actions} stages={stages} communityId={community.id}>
			<StageEditorProvider communitySlug={params.communitySlug}>
				<LocalStorageProvider timeout={200}>
					<div className="h-full w-full shadow-[inset_6px_0px_10px_-4px_rgba(0,0,0,0.1)] z-50 absolute top-0 left-0 v-full w-full">
						<div className="h-full relative select-none">
							<StageEditor />
							<StageEditorPanel
								communitySlug={params.communitySlug}
								editingStageId={searchParams.editingStageId}
							/>
						</div>
					</div>
				</LocalStorageProvider>
			</StageEditorProvider>
		</StagesProvider>
	);
}
