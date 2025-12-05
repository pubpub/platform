import type { CommunitiesId, StagesId, UsersId } from "db/public"

import { getStageAutomations } from "~/lib/db/queries"
import { getActionConfigDefaultsFields } from "~/lib/server/actions"
import { getStages } from "~/lib/server/stages"
import { StagePanelAutomationsContent } from "./StagePanelAutomationsContent"

type Props = {
	userId: UsersId
	communityId: CommunitiesId
	stageId: StagesId
}

export async function StagePanelAutomationsLoader(props: Props) {
	const [stage, actionConfigDefaults, automations] = await Promise.all([
		getStages(
			{ stageId: props.stageId, userId: props.userId, communityId: props.communityId },
			{
				withAutomations: {
					detail: "full",
					filter: "all",
				},
			}
		).executeTakeFirst(),
		getActionConfigDefaultsFields(props.communityId),
		getStageAutomations(props.stageId),
	])

	if (!stage) {
		return null
	}

	return (
		<StagePanelAutomationsContent
			userId={props.userId}
			communityId={props.communityId}
			stage={stage}
			actionConfigDefaults={actionConfigDefaults}
			automations={automations}
		/>
	)
}
