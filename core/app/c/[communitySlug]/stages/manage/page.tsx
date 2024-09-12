import "reactflow/dist/style.css";

import { LocalStorageProvider } from "ui/hooks";

import { getPageLoginData } from "~/lib/auth/loginData";
import { createCommunityCacheTags } from "~/lib/server/cache/cacheTags";
import { memoize } from "~/lib/server/cache/memoize";
import { stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { StageEditor } from "./components/editor/StageEditor";
import { StageEditorProvider } from "./components/editor/StageEditorContext";
import { StagePanel } from "./components/panel/StagePanel";
import { StagesProvider } from "./StagesContext";

type Props = {
	params: { communitySlug: string };
	searchParams: {
		editingStageId: string | undefined;
	};
};

export default async function Page({ params, searchParams }: Props) {
	await getPageLoginData();
	const community = await prisma.community.findUnique({
		where: { slug: params.communitySlug },
	});

	if (!community) {
		return null;
	}

	const getCommunityStages = memoize(
		(communityId: string) =>
			prisma.stage.findMany({
				where: { communityId },
				include: stageInclude,
			}),
		{
			revalidateTags: createCommunityCacheTags(
				[
					"stages",
					"pubs",
					"PubsInStages",
					"action_instances",
					"move_constraint",
					"permissions",
					"integrations",
				],
				params.communitySlug
			),
		}
	);

	const stages = await getCommunityStages(community.id);

	const pageContext = {
		params,
		searchParams,
	};

	return (
		<StagesProvider stages={stages} communityId={community.id}>
			<StageEditorProvider communitySlug={params.communitySlug}>
				<LocalStorageProvider timeout={200}>
					<div className="v-full absolute left-0 top-0 z-50 h-full w-full shadow-[inset_6px_0px_10px_-4px_rgba(0,0,0,0.1)]">
						<div className="relative h-full select-none">
							<StageEditor />
							<StagePanel
								stageId={searchParams.editingStageId}
								pageContext={pageContext}
							/>
						</div>
					</div>
				</LocalStorageProvider>
			</StageEditorProvider>
		</StagesProvider>
	);
}
