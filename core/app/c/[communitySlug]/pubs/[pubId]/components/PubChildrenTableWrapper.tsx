import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType } from "db/public";
import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { StagePub } from "~/lib/db/queries";
import type { CommunityMemberPayload, PubPayload } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { db } from "~/kysely/database";
import { getStageActions } from "~/lib/db/queries";
import { autoCache } from "~/lib/server/cache/autoCache";
import { PubChildrenTable } from "./PubChildrenTable";

const getPubChildrenTablePubs = (parentId: PubsId) => {
	return autoCache(
		db
			.with("member-fields", (eb) =>
				eb
					.selectFrom("pub_values")
					.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
					.innerJoin("pubs", "pubs.id", "pub_values.pubId")
					.select(["pub_values.value", "pub_values.pubId"])
					.where("pubs.parentId", "=", parentId)
					.where("schemaName", "=", CoreSchemaType.MemberId)
					.distinctOn("pub_fields.id")
					.orderBy(["pub_fields.id", "pub_values.createdAt desc"])
			)
			.selectFrom("pubs")
			.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
			.select((eb) => [
				"pubs.id",
				jsonArrayFrom(
					eb
						.selectFrom("member-fields")
						.innerJoin("members", "members.id", "member-fields.value")
						.select((eb) => [
							"members.id",
							jsonObjectFrom(
								eb
									.selectFrom("users")
									.select([
										"users.id",
										"users.firstName",
										"users.lastName",
										"users.avatar",
									])
									.whereRef("users.id", "=", "members.userId")
							).as("user"),
						])
						.whereRef("pubs.id", "=", "member-fields.pubId")
				).as("members"),
				jsonArrayFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.stageId", "=", "PubsInStages.stageId")
						.selectAll()
				).as("actions"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.select(["stages.id", "stages.name"])
						.whereRef("stages.id", "=", "stages.id")
				).as("stage"),
			])
			.where("parentId", "=", parentId)
	);
};

const EmptyActions = () => {
	return (
		<div className="flex items-center space-x-1">
			<span className="text-muted-foreground">None</span>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Info className="h-4 w-4 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>
						The pub's current stage has no actions configured.
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};

const childToTableRow = async (
	child: PubPayload["children"][number],
	members: CommunityMemberPayload[]
) => {
	const stage = child.stages[0];
	const stageActionInstances = stage && (await getStageActions(stage.stageId));
	const assigneeUser = members.find((m) => m.userId === child.assigneeId)?.user;

	return {
		id: child.id,
		title:
			(child.values.find((value) => value.field.name === "Title")?.value as string) ||
			"Evaluation",
		stage: child.stages[0]?.stage.name,
		assignee: assigneeUser ? `${assigneeUser.firstName} ${assigneeUser.lastName}` : null,
		created: new Date(child.createdAt),
		values: child.values,
		actions:
			stage && stageActionInstances && stageActionInstances.length > 0 ? (
				<PubsRunActionDropDownMenu
					actionInstances={stageActionInstances}
					pub={child as unknown as StagePub}
					stage={stage.stage as Stages}
					pageContext={
						{
							params: undefined,
							searchParams: undefined,
						} as unknown as PageContext
					}
				/>
			) : (
				<EmptyActions />
			),
	};
};

type Props = {
	pub: PubPayload;
	pubType?: PubPayload["pubType"];
	members: CommunityMemberPayload[];
};

async function PubChildrenTableWrapper(props: Props) {
	const { pubType } = props;
	const childrenOfPubType = pubType
		? props.pub.children.filter((child) => child.pubType.id === pubType.id)
		: props.pub.children;
	const children = await Promise.all(
		childrenOfPubType.map((child) => childToTableRow(child, props.members))
	);
	return <PubChildrenTable children={children} pubType={pubType} />;
}

export default PubChildrenTableWrapper;
