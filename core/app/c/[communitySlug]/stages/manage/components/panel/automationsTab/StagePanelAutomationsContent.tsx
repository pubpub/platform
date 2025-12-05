"use client"

import type { CommunitiesId, UsersId } from "db/public"
import type { FullAutomation } from "db/types"
import type { ActionConfigDefaultFields } from "~/lib/server/actions"
import type { CommunityStage } from "~/lib/server/stages"

import { ChevronLeft } from "lucide-react"

import { Button } from "ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "ui/card"
import { DynamicIcon, type IconConfig } from "ui/dynamic-icon"

import { StagePanelAutomationForm } from "./StagePanelAutomationForm"
import { StagePanelAutomations } from "./StagePanelAutomations"
import { useAutomationId } from "./useAutomationId"

type Props = {
	userId: UsersId
	communityId: CommunitiesId
	stage: CommunityStage
	automations: FullAutomation[]
	actionConfigDefaults: ActionConfigDefaultFields
}

export function StagePanelAutomationsContent(props: Props) {
	const { automationId, setAutomationId } = useAutomationId()
	const currentAutomation = props.automations.find((automation) => automation.id === automationId)

	return (
		<div className="relative flex h-full w-full">
			<div
				className="absolute inset-0 w-full space-y-2 transition-transform duration-300 ease-in-out"
				style={{
					transform: automationId ? "translateX(-110%)" : "translateX(0)",
				}}
			>
				<StagePanelAutomations
					automations={props.automations}
					stage={props.stage}
					userId={props.userId}
					communityId={props.communityId}
				/>
			</div>

			<div
				className="absolute inset-0 w-full transition-transform duration-300 ease-in-out"
				style={{
					transform: automationId ? "translateX(0)" : "translateX(110%)",
				}}
			>
				<Card className="h-full overflow-y-auto pt-0">
					<CardHeader className="sticky top-0 z-10 flex items-center gap-3 bg-white pt-6 pb-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setAutomationId(null)}
							className="h-8 w-8 p-0"
							data-testid="automation-edit-back-button"
						>
							<ChevronLeft size={16} />
							<span className="sr-only">Back to automations</span>
						</Button>
						<CardTitle className="flex items-center gap-2">
							{currentAutomation ? (
								<>
									<DynamicIcon
										icon={currentAutomation.icon as IconConfig | null}
										size={16}
									/>
									<h2>{currentAutomation.name}</h2>
								</>
							) : (
								<h2 className="font-semibold text-lg">Add automation</h2>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-6">
						<StagePanelAutomationForm
							key={automationId}
							stageId={props.stage.id}
							communityId={props.communityId}
							automations={props.automations}
							actionConfigDefaults={props.actionConfigDefaults}
							currentAutomation={currentAutomation ?? null}
							onSuccess={() => setAutomationId(null)}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
