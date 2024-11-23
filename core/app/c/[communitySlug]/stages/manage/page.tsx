import "reactflow/dist/style.css";

import type { Metadata } from "next";

import type { StagesId } from "db/public";
import { LocalStorageProvider } from "ui/hooks";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { getStage } from "~/lib/db/queries";
import { findCommunityBySlug } from "~/lib/server/community";
import { getCommunityStages } from "~/lib/server/stages";
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

export async function generateMetadata({
	params: { communitySlug },
	searchParams: { editingStageId },
}: {
	params: { communitySlug: string };
	searchParams: {
		editingStageId: string | undefined;
	};
}): Promise<Metadata> {
	if (!editingStageId) {
		return { title: "Workflow Editor" };
	}

	const stage = await getStage(editingStageId as StagesId).executeTakeFirst();

	if (!stage) {
		return { title: "Stage" };
	}

	return { title: stage.name };
}

export default async function Page({ params, searchParams }: Props) {
	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		return null;
	}

	const stages = await getCommunityStages(community.id).execute();

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
							{searchParams.editingStageId && (
								<StagePanel
									stageId={searchParams.editingStageId as StagesId}
									pageContext={pageContext}
									isSuperAdmin={user.isSuperAdmin}
								/>
							)}
						</div>
					</div>
				</LocalStorageProvider>
			</StageEditorProvider>
		</StagesProvider>
	);
}
