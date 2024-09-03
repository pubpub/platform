import { Expression, ExpressionBuilder, sql } from "kysely";
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

const stage = (stageId: Expression<string>) =>
	jsonArrayFrom(
		db
			.selectFrom("stages")
			.select(["stages.id", "stages.name"])
			.whereRef("stages.id", "=", stageId)
	);

const actionInstances = (stageId: Expression<string>) =>
	jsonArrayFrom(
		db
			.selectFrom("action_instances")
			.whereRef("action_instances.stageId", "=", stageId)
			.selectAll()
	);

const memberFields = (pubId: Expression<string>) =>
	jsonArrayFrom(
		db
			.selectFrom("pub_values")
			.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
			.innerJoin("members", (join) =>
				join.on((eb) => eb("members.id", "=", sql`pub_values.value #>> '{}'`))
			)
			.select(["members.id", "members.userId", "pub_fields.name"])
			.whereRef("pub_values.pubId", "=", pubId)
			.where("pub_fields.schemaName", "=", CoreSchemaType.MemberId)
			.distinctOn("pub_fields.id")
			.orderBy(["pub_fields.id", "pub_values.createdAt desc"])
	);

const getPubChildrenTablePubs = (parentId: PubsId) => {
	return autoCache(
		db
			.selectFrom("pubs")
			.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
			.select((eb) => [
				"pubs.id",
				memberFields(eb.ref("pubs.id")).as("members"),
				actionInstances(eb.ref("PubsInStages.stageId")).as("actions"),
				stage(eb.ref("PubsInStages.stageId")).as("stage"),
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
