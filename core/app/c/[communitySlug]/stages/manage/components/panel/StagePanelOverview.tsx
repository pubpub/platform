import type { StagesId, UsersId } from "db/public"

import { List } from "lucide-react"

import { Card, CardContent, CardTitle } from "ui/card"
import { Separator } from "ui/separator"

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import { getStage } from "~/lib/db/queries"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { deleteStage, updateStageName } from "../../actions"
import { StagePanelCardHeader } from "../editor/StagePanelCard"
import { StageNameInput } from "./StageNameInput"
import { StagePanelOverviewManagement } from "./StagePanelOverviewManagement"

type Props = {
	stageId: StagesId
	userId: UsersId
}

export const StagePanelOverview = async (props: Props) => {
	const [stage, communitySlug] = await Promise.all([
		getStage(props.stageId, props.userId).executeTakeFirst(),
		getCommunitySlug(),
	])

	if (stage === undefined) {
		return <SkeletonCard />
	}

	const onNameChange = updateStageName.bind(null, stage.id)
	const onDelete = deleteStage.bind(null, stage.id)

	return (
		<Card>
			<StagePanelCardHeader className="justify-start gap-2">
				<div className="flex items-center gap-2">
					<List size={16} />
					<CardTitle>Overview</CardTitle>
				</div>
			</StagePanelCardHeader>
			<CardContent className="space-y-4">
				<StageNameInput value={stage.name} onChange={onNameChange} />
				<Separator />
				<StagePanelOverviewManagement
					communitySlug={communitySlug}
					stageId={props.stageId}
					onDelete={onDelete}
				/>
			</CardContent>
		</Card>
	)
}
