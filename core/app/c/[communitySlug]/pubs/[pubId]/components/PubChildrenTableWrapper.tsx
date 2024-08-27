import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { StagePub } from "~/lib/db/queries";
import type { CommunityMemberPayload, PubPayload } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { getStage, getStageActions } from "~/lib/db/queries";
import { PubChildrenTable } from "./PubChildrenTable";

async function PubChildrenTableWrapper({
	pub,
	members,
}: {
	pub: PubPayload;
	members: CommunityMemberPayload[];
}) {
	const pubChildren = pub.children.map(async (child) => {
		const [stageActionInstances, stage] =
			child.stages.length > 0
				? await Promise.all([
						getStageActions(child.stages[0].stageId),
						getStage(child.stages[0].stageId),
					])
				: [null, null];
		const assigneeUser = members.find((m) => m.userId === child.assigneeId)?.user;

		return {
			id: child.id,
			title:
				(child.values.find((value) => value.field.name === "Title")?.value as string) ||
				"Evaluation",
			stage: child.stages[0]?.stage.name,
			assignee: assigneeUser ? `${assigneeUser.firstName} ${assigneeUser.lastName}` : null,
			created: new Date(child.createdAt),
			actions:
				stageActionInstances && stageActionInstances.length > 0 ? (
					<PubsRunActionDropDownMenu
						actionInstances={stageActionInstances.map((action) => ({
							...action,
						}))}
						pub={child as unknown as StagePub}
						stage={stage!}
						pageContext={
							{
								params: undefined,
								searchParams: undefined,
							} as unknown as PageContext
						}
					/>
				) : (
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
				),
		};
	});

	const children = await Promise.all(pubChildren);
	return <PubChildrenTable children={children} />;
}

export default PubChildrenTableWrapper;
