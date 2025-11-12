import "reactflow/dist/style.css";

import type { Metadata } from "next";

import { redirect } from "next/navigation";

import type { AutomationsId, StagesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { LocalStorageProvider } from "ui/hooks";
import { PubFieldProvider } from "ui/pubFields";
import { stagesDAO, StagesProvider } from "ui/stages";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getStage } from "~/lib/db/queries";
import { SSERevalidator } from "~/lib/notify/SSERevalidator";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { StageEditor } from "./components/editor/StageEditor";
import { StageEditorProvider } from "./components/editor/StageEditorContext";
import { StagePanel } from "./components/panel/StagePanel";
import { getStagesCached } from "./queries";
import { StagesManageProvider } from "./StagesContext";

type Props = {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{
		editingStageId?: string;
		tab?: string;
		automationId?: AutomationsId;
	}>;
};

export async function generateMetadata(props: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<{
		editingStageId: string | undefined;
	}>;
}): Promise<Metadata> {
	const searchParams = await props.searchParams;

	const { editingStageId } = searchParams;

	const params = await props.params;

	if (!editingStageId) {
		return { title: "Workflow Editor" };
	}

	const { user } = await getPageLoginData();

	const stage = await getStage(editingStageId as StagesId, user.id).executeTakeFirst();

	if (!stage) {
		return { title: "Stage" };
	}

	return { title: stage.name };
}

export default async function Page(props: Props) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()]);

	if (!community) {
		return null;
	}

	if (
		!(await userCan(
			Capabilities.editCommunity,
			{ communityId: community.id, type: MembershipType.community },
			user.id
		))
	) {
		redirect(`/c/${params.communitySlug}/unauthorized`);
	}

	const [stages, pubFields] = await Promise.all([
		getStagesCached(community.id, user.id),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
	]);

	return (
		<>
			<StagesManageProvider stages={stages} communityId={community.id}>
				<StagesProvider stages={stagesDAO(stages)}>
					<PubFieldProvider pubFields={pubFields.fields}>
						<StageEditorProvider communitySlug={params.communitySlug}>
							<LocalStorageProvider timeout={200}>
								<div className="v-full absolute left-0 top-0 z-50 h-full w-full shadow-[inset_6px_0px_10px_-4px_rgba(0,0,0,0.1)]">
									<div className="relative h-full select-none">
										<StageEditor />
										{searchParams.editingStageId && (
											<StagePanel
												stageId={searchParams.editingStageId as StagesId}
												searchParams={searchParams}
												user={user}
											/>
										)}
									</div>
								</div>
							</LocalStorageProvider>
						</StageEditorProvider>
					</PubFieldProvider>
				</StagesProvider>
			</StagesManageProvider>
			<SSERevalidator listenTables={["action_runs"]} />
		</>
	);
}
