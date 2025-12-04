import type { CommunitiesId, UsersId } from "db/public"
import type { CommunityStage } from "~/lib/server/stages"

import { Card, CardContent, CardTitle } from "ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "ui/empty"
import { Bot } from "ui/icon"
import { ItemGroup } from "ui/item"

import { StagePanelCardHeader } from "../../editor/StagePanelCard"
import { AddAutomationButton } from "./AddAutomationButton"
import { StagePanelAutomation } from "./StagePanelAutomation"

type Props = {
	userId: UsersId
	stage: CommunityStage
	communityId: CommunitiesId
}

export const StagePanelAutomations = (props: Props) => {
	return (
		<Card className="h-full">
			<StagePanelCardHeader>
				<div className="flex items-center gap-2">
					<Bot size={16} />
					<CardTitle>Automations</CardTitle>
				</div>
				<AddAutomationButton />
			</StagePanelCardHeader>
			<CardContent>
				<ItemGroup className="gap-y-2">
					{props.stage.fullAutomations?.length > 0 ? (
						props.stage.fullAutomations.map((automation) => (
							<StagePanelAutomation
								stageId={props.stage.id}
								communityId={props.stage.communityId as CommunitiesId}
								automation={automation}
								key={automation.id}
							/>
						))
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Bot size={16} />
								</EmptyMedia>
								<EmptyTitle>No automations</EmptyTitle>
								<EmptyDescription>
									Add an automation to get started
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</ItemGroup>
			</CardContent>
		</Card>
	)
}
