import "reactflow/dist/style.css";

import type { Metadata } from "next";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, StagesId } from "db/public";
import { LocalStorageProvider } from "ui/hooks";

import { pubCRUDSearchParamsCache } from "~/app/components/PubCRUD/pubCRUDSearchParamsServer";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/auth/loginData";
import { getStage } from "~/lib/db/queries";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { modalSearchParamsCache } from "~/lib/server/modal";
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

const getCommunityStages = (communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("stages")
			.where("communityId", "=", communityId)
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.selectAll("move_constraint")
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("stages")
									.whereRef("stages.id", "=", "move_constraint.destinationId")
									.selectAll("stages")
							)
								.$notNull()
								.as("destination"),
						])
				).as("moveConstraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.selectAll("move_constraint")
				).as("moveConstraintSources"),
				eb
					.selectFrom("PubsInStages")
					.select((eb) =>
						eb.fn
							.count<number>("PubsInStages.pubId")
							.filterWhereRef("PubsInStages.stageId", "=", "stages.id")
							.as("pubsCount")
					)
					.as("pubsCount"),
				// TODO: needs to be fancier and include member groups
				eb
					.selectFrom("permissions")
					.innerJoin("_PermissionToStage", "permissions.id", "_PermissionToStage.A")
					.innerJoin("members", "_PermissionToStage.B", "members.id")
					.select((eb) =>
						eb.fn
							.count("_PermissionToStage.A")
							.filterWhereRef("_PermissionToStage.B", "=", "stages.id")
							.as("memberCount")
					)
					.as("memberCount"),

				eb
					.selectFrom("action_instances")
					.whereRef("action_instances.stageId", "=", "stages.id")
					.select((eb) =>
						eb.fn.count<number>("action_instances.id").as("actionInstancesCount")
					)
					.as("actionInstancesCount"),
			])
			.selectAll("stages")
			.orderBy("order asc")
	);

export type CommunityStage = Awaited<
	ReturnType<ReturnType<typeof getCommunityStages>["execute"]>
>[number];

export default async function Page({ params, searchParams }: Props) {
	await getPageLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		return null;
	}

	modalSearchParamsCache.parse(searchParams);

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
								/>
							)}
						</div>
					</div>
				</LocalStorageProvider>
			</StageEditorProvider>
		</StagesProvider>
	);
}
