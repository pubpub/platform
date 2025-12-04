"use client"

import type { CommunitiesId, StagesId } from "db/public"
import type { FullAutomation } from "db/types"
import type { ActionConfigDefaultFields } from "~/lib/server/actions"

import { ArrowLeft } from "lucide-react"

import { Button } from "ui/button"

import { StagePanelAutomationForm } from "./StagePanelAutomationForm"
import { useAutomationId } from "./useAutomationId"

type Props = {
	stageId: StagesId
	communityId: CommunitiesId
	automations: FullAutomation[]
	actionConfigDefaults: ActionConfigDefaultFields
}

export function StagePanelAutomationEdit(props: Props) {
	const { automationId, setAutomationId } = useAutomationId()

	const handleBack = () => {
		setAutomationId(null)
	}
	const isExistingAutomation = !!automationId

	return (
		<div className="flex h-full flex-col">
			<div className="sticky top-0 z-10 border-b bg-white p-6 pb-4">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleBack}
						className="h-8 w-8 p-0"
						data-testid="automation-edit-back-button"
					>
						<ArrowLeft size={16} />
						<span className="sr-only">Back to automations</span>
					</Button>
					<div>
						<h2 className="font-semibold text-lg">
							{isExistingAutomation ? "Edit automation" : "Add automation"}
						</h2>
						<p className="text-muted-foreground text-sm">
							Set up an automation to run whenever a certain event is triggered.
						</p>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				<StagePanelAutomationForm
					stageId={props.stageId}
					communityId={props.communityId}
					automations={props.automations}
					actionConfigDefaults={props.actionConfigDefaults}
					automationId={automationId}
					onSuccess={handleBack}
				/>
			</div>
		</div>
	)
}
