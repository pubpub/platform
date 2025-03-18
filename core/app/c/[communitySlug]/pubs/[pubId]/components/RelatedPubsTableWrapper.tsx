import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { FullProcessedPub } from "~/lib/server";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { RelatedPubsTable } from "./RelatedPubsTable";

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
	);
};

const getRelatedPubRunActionsDropdowns = (row: FullProcessedPub, pageContext: PageContext) => {
	return row.stage && row.stage?.actionInstances.length > 0 ? (
		<PubsRunActionDropDownMenu
			actionInstances={row.stage.actionInstances}
			pubId={row.id}
			stage={row.stage}
			pageContext={pageContext}
		/>
	) : (
		<NoActions />
	);
};

type Props = {
	pub: FullProcessedPub;
	pageContext: PageContext;
};

export const RelatedPubsTableWrapper = async (props: Props) => {
	const relatedPubRunActionsDropdowns = props.pub.values.reduce(
		(a, value) =>
			value.relatedPubId && value.relatedPub
				? {
						...a,
						[value.relatedPubId]: getRelatedPubRunActionsDropdowns(
							value.relatedPub,
							props.pageContext
						),
					}
				: a,
		{}
	);
	return (
		<RelatedPubsTable
			pub={props.pub}
			relatedPubActionsDropdowns={relatedPubRunActionsDropdowns}
		/>
	);
};
