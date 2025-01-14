import Link from "next/link";

import type { PubsId, PubTypesId } from "db/public";
import { buttonVariants } from "ui/button";
import { Info } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { cn } from "utils";

import type { ChildPubRow } from "./types";
import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { pubPath } from "~/lib/paths";
import { PubChildrenTable } from "./PubChildrenTable";
import { getPubChildrenTable } from "./queries";

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
	parentPubSlug: string;
	pageContext: PageContext;
};

type PubTypeSwitcherProps = {
	communitySlug: string;
	pubSlug: string;
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
						href={`${pubPath(props.communitySlug, props.pubSlug)}?${linkSearchParams.toString()}`}
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

async function PubChildrenTableWrapper(props: Props) {
	const pubChildren = await getPubChildrenTable(
		props.parentPubId,
		props.pageContext.searchParams.selectedPubType as PubTypesId
	).executeTakeFirst();

	if (!pubChildren) {
		return <PubChildrenTable childPubRows={[]} childPubRunActionDropdowns={[]} />;
	}

	const selectedPubTypeId = pubChildren.active_pubtype?.id;

	const selectedPubType = pubChildren.active_pubtype;
	return (
		<>
			<PubTypeSwitcher
				communitySlug={props.communitySlug}
				pubSlug={props.parentPubSlug}
				pubTypes={pubChildren.counts_of_all_pub_types}
				searchParams={props.pageContext.searchParams}
				selectedPubTypeId={selectedPubTypeId}
			/>
			<PubChildrenTable
				childPubRows={pubChildren.children_of_active_pubtype}
				childPubType={selectedPubType}
				childPubRunActionDropdowns={pubChildren.children_of_active_pubtype.map((row) =>
					getChildPubRunActionDropdowns(row, props.pageContext)
				)}
			/>
		</>
	);
}

export default PubChildrenTableWrapper;
