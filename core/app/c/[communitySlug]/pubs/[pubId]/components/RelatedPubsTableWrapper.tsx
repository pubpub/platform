import type { FullProcessedPubWithForm } from "~/lib/server"

import { Info } from "ui/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"

import { PubsRunAutomationsDropDownMenu } from "~/app/components/ActionUI/PubsRunAutomationDropDownMenu"
import { RelatedPubsTable } from "./RelatedPubsTable"

const NoActions = () => {
	return (
		<div className="flex items-center space-x-1">
			<span className="text-muted-foreground">None</span>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Info className="h-4 w-4 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>
						This pub's current stage has no actions configured.
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}

const getRelatedPubRunActionsDropdowns = (row: FullProcessedPubWithForm) => {
	return row.stage && row.stage?.actionInstances.length > 0 ? (
		<PubsRunAutomationsDropDownMenu
			actionInstances={row.stage.actionInstances}
			pubId={row.id}
		/>
	) : (
		<NoActions />
	)
}

type Props = {
	pub: FullProcessedPubWithForm
	userCanRunActions: boolean
}

export const RelatedPubsTableWrapper = async (props: Props) => {
	const relatedPubRunActionsDropdowns = !props.userCanRunActions
		? {}
		: props.pub.values.reduce(
				(a, value) =>
					value.relatedPubId && value.relatedPub
						? {
								...a,
								[value.relatedPubId]: getRelatedPubRunActionsDropdowns(
									value.relatedPub
								),
							}
						: a,
				{}
			)
	return (
		<RelatedPubsTable
			pub={props.pub}
			relatedPubActionsDropdowns={relatedPubRunActionsDropdowns}
		/>
	)
}
