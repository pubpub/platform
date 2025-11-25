import type { StagesId } from "db/public"
import type { User } from "lucia"

<<<<<<< HEAD
import { BookOpen, List, Users, Wand2 } from "lucide-react";

import type { StagesId } from "db/public";
import { Tabs, TabsContent, TabsList } from "ui/tabs";

import { getStage } from "~/lib/db/queries";
import { StagePanelAutomations } from "./actionsTab/StagePanelAutomations";
import { StagePanelMembers } from "./StagePanelMembers";
import { StagePanelOverview } from "./StagePanelOverview";
import { StagePanelPubs } from "./StagePanelPubs";
import { StagePanelSheet } from "./StagePanelSheet";
import { TabLink } from "./StagePanelTabLink";
=======
import { Tabs, TabsContent, TabsList } from "ui/tabs"

import { getStage } from "~/lib/db/queries"
import { StagePanelActions } from "./actionsTab/StagePanelActions"
import { StagePanelAutomations } from "./actionsTab/StagePanelAutomations"
import { StagePanelMembers } from "./StagePanelMembers"
import { StagePanelOverview } from "./StagePanelOverview"
import { StagePanelPubs } from "./StagePanelPubs"
import { StagePanelSheet } from "./StagePanelSheet"
import { TabLink } from "./StagePanelTabLink"
>>>>>>> main

type Props = {
	stageId: StagesId | undefined
	searchParams: Record<string, string>
	user: User
}

export const StagePanel = async (props: Props) => {
	let open = Boolean(props.stageId)

	if (!props.stageId) {
		return null
	}

	if (props.stageId) {
		const stage = await getStage(props.stageId, props.user.id).executeTakeFirst()
		if (stage === null) {
			open = false
		}
	}

	const defaultTab = props.searchParams.tab || "overview"

	return (
		<StagePanelSheet open={open}>
			<Tabs defaultValue={defaultTab}>
				<TabsList className="grid grid-cols-4">
					<TabLink tab="overview">
						<List size={16} />
					</TabLink>
					<TabLink tab="pubs">
						<BookOpen size={16} />
					</TabLink>
					<TabLink tab="automations">
						<Wand2 size={16} />
					</TabLink>
					<TabLink tab="members">
						<Users size={16} />
					</TabLink>
				</TabsList>
				<TabsContent value="overview">
					<StagePanelOverview stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="pubs">
					<StagePanelPubs
						stageId={props.stageId as StagesId}
						searchParams={props.searchParams}
						userId={props.user.id}
					/>
				</TabsContent>
				<TabsContent value="automations" className="space-y-2">
					{/* <StagePanelActions stageId={props.stageId} userId={props.user.id} /> */}
					<StagePanelAutomations stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="members">
					<StagePanelMembers stageId={props.stageId} user={props.user} />
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	)
}
