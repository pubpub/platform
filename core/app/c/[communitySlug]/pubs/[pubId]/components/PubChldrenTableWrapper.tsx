import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { StagePub } from "~/lib/db/queries";
import type { CommunityMemberPayload, PubPayload } from "~/lib/types";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { getStage, getStageActions } from "~/lib/db/queries";
import { getPubTitle } from "~/lib/pubs";
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
			title: getPubTitle(child),
			stage: child.stages[0]?.stage.name ?? "Not in Stage",
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
					<div>No actions exist on the pub</div>
				),
		};
	});

	const children = await Promise.all(pubChildren);
	return <PubChildrenTable children={children} />;
}

export default PubChildrenTableWrapper;
