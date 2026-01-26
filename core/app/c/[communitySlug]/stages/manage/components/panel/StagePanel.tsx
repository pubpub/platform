import type { CommunitiesId, StagesId } from "db/public"
import type { User } from "lucia"

import { Suspense } from "react"
import { BookOpen, Bot, List, Users } from "lucide-react"

import { Tabs, TabsContent, TabsList } from "ui/tabs"

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard"
import { getStage } from "~/lib/db/queries"
import { StagePanelAutomationsLoader } from "./automationsTab/StagePanelAutomationsLoader"
import { StagePanelMembers } from "./StagePanelMembers"
import { StagePanelOverview } from "./StagePanelOverview"
import { StagePanelPubs } from "./StagePanelPubs"
import { StagePanelSheet } from "./StagePanelSheet"
import { StageTabLink } from "./StagePanelTabLink"

type Props = {
	stageId: StagesId | undefined
	searchParams: Record<string, string>
	communityId: CommunitiesId
	user: User
}

export const StagePanel = async (props: Props) => {
	if (!props.stageId) {
		return null
	}

	if (props.stageId) {
		const stage = await getStage(props.stageId, props.user.id).executeTakeFirst()
		if (!stage) {
			return null
		}
	}

	const defaultTab = props.searchParams.tab || "overview"

	return (
		<StagePanelSheet defaultOpen={Boolean(props.stageId)}>
			<Tabs defaultValue={defaultTab} className="h-full">
				<TabsList className="mb-2 grid grid-cols-4">
					<StageTabLink tab="overview">
						<List size={16} />
					</StageTabLink>
					<StageTabLink tab="pubs">
						<BookOpen size={16} />
					</StageTabLink>
					<StageTabLink tab="automations">
						<Bot size={16} />
					</StageTabLink>
					<StageTabLink tab="members">
						<Users size={16} />
					</StageTabLink>
				</TabsList>
				<TabsContent value="overview">
					<Suspense fallback={<SkeletonCard />}>
						<StagePanelOverview stageId={props.stageId} userId={props.user.id} />
					</Suspense>
				</TabsContent>
				<TabsContent value="pubs" className="h-full">
					<Suspense fallback={<SkeletonCard />}>
						<StagePanelPubs
							stageId={props.stageId as StagesId}
							searchParams={props.searchParams}
							userId={props.user.id}
						/>
					</Suspense>
				</TabsContent>
				<TabsContent value="automations" className="h-full">
					<Suspense fallback={<SkeletonCard />}>
						<StagePanelAutomationsLoader
							stageId={props.stageId}
							userId={props.user.id}
							communityId={props.communityId}
						/>
					</Suspense>
				</TabsContent>
				<TabsContent value="members" className="h-full">
					<Suspense fallback={<SkeletonCard />}>
						<StagePanelMembers stageId={props.stageId} user={props.user} />
					</Suspense>
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	)
}
