import Link from "next/link";

import type { PubsId, PubTypesId } from "db/public";
import { buttonVariants } from "ui/button";
import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { PubChildrenTable } from "./PubChildrenTable";
import { getPubChildrenTable } from "./queries";
import { ChildPubRow, ChildPubRowPubType } from "./types";

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
						The pub's current stage has no actions configured.
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};

const getChildPubRunActionDropdowns = (row: ChildPubRow, pageContext: PageContext) => {
	const stage = row.stages[0];
	return stage && row.actionInstances.length > 0 ? (
		<PubsRunActionDropDownMenu
			actionInstances={row.actionInstances}
			pubId={row.id}
			stage={stage}
			pageContext={pageContext}
		/>
	) : (
		<NoActions />
	);
};

type Props = {
	communitySlug: string;
	parentPubId: PubsId;
	pageContext: PageContext;
};

type PubTypeSwitcherProps = {
	communitySlug: string;
	pubId: string;
	pubTypes: {
		count: number;
		name: string;
		pubTypeId: PubTypesId;
	}[];
	searchParams: Record<string, unknown>;
	selectedPubTypeId?: string;
};

const PubTypeSwitcher = (props: PubTypeSwitcherProps) => {
	return (
		<nav className="flex w-48 gap-1">
			{props.pubTypes.map((pubType, pubTypeIndex) => {
				const isSelected = props.selectedPubTypeId === pubType.pubTypeId;
				const linkSearchParams = new URLSearchParams(
					props.searchParams as Record<string, string>
				);
				linkSearchParams.set("selectedPubType", pubType.pubTypeId);
				return (
					<Link
						prefetch
						key={pubType.pubTypeId}
						href={`/c/${props.communitySlug}/pubs/${props.pubId}?${linkSearchParams}`}
						className={cn(
							buttonVariants({
								variant: isSelected ? "default" : "ghost",
								size: "default",
							}),
							"flex",
							"items-center",
							"gap-2"
						)}
						scroll={false}
					>
						{pubType.name}
						<span
							className={cn(
								"ml-auto",
								"font-mono",
								"text-xs",
								isSelected && "text-background dark:text-white"
							)}
						>
							{pubType.count}
						</span>
					</Link>
				);
			})}
		</nav>
	);
};

const getUniqueChildPubTypes = (children: ChildPubRow[]) => {
	const pubTypesById = new Map<string, ChildPubRowPubType>();
	const pubTypeCounts = new Map<string, number>();
	children.forEach((child) => {
		if (!child.pubType) {
			return;
		}
		const pubTypeId = child.pubType.id;
		if (pubTypesById.has(pubTypeId)) {
			pubTypeCounts.set(pubTypeId, pubTypeCounts.get(pubTypeId)! + 1);
		} else {
			pubTypesById.set(pubTypeId, child.pubType);
			pubTypeCounts.set(pubTypeId, 1);
		}
	});
	return {
		pubTypes: Array.from(pubTypesById.values()),
		pubTypeCounts: Array.from(pubTypeCounts.values()),
	};
};

async function PubChildrenTableWrapper(props: Props) {
	const stuff = await getPubChildrenTable(
		props.parentPubId,
		props.pageContext.searchParams.selectedPubType as PubTypesId
	).executeTakeFirst();
	const selectedPubTypeId = stuff?.active_pubtype?.id;

	const selectedPubType = stuff?.active_pubtype;
	return (
		<>
			<PubTypeSwitcher
				communitySlug={props.communitySlug}
				pubId={props.parentPubId}
				pubTypes={stuff?.counts_of_all_pub_types}
				searchParams={props.pageContext.searchParams}
				selectedPubTypeId={selectedPubTypeId}
			/>
			<PubChildrenTable
				childPubRows={stuff?.children_of_active_pubtype}
				childPubType={selectedPubType}
				childPubRunActionDropdowns={stuff?.children_of_active_pubtype.map((row) =>
					getChildPubRunActionDropdowns(row, props.pageContext)
				)}
			/>
		</>
	);
}

export default PubChildrenTableWrapper;
