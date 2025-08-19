"use client";

import { useState } from "react";
import { ChevronDown, FlagTriangleRightIcon, Plus, X } from "lucide-react";
import { useQueryStates } from "nuqs";

import type { PubTypesId, StagesId } from "db/public";
import { Button } from "ui/button";
import { cn } from "utils";

import { pubSearchParsers } from "~/app/c/[communitySlug]/pubs/pubQuery";
import { BasicMoveButton } from "~/app/c/[communitySlug]/stages/components/BasicMoveButton";

export const StageMoveButton = ({
	stage,
	canFilter,
	withDropdown,
}: {
	stage: {
		id: StagesId;
		name: string;
	};
	withDropdown?: boolean;
	canFilter?: boolean;
}) => {
	if (!canFilter) {
		return <BasicMoveButton name={stage.name} withDropdown={withDropdown} />;
	}

	return <FilterableStageMoveButton stage={stage} withDropdown={withDropdown} />;
};

export const FilterableStageMoveButton = ({
	stage,
	withDropdown,
}: {
	stage: {
		id: StagesId;
		name: string;
	};
	withDropdown?: boolean;
}) => {
	const [query, setQuery] = useQueryStates(pubSearchParsers, {
		shallow: false,
	});
	const [expanded, setExpanded] = useState(false);

	const currentStages = query.stages ?? [];

	const isSelected = currentStages.includes(stage.id);

	return (
		<div
			className="relative"
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
		>
			<Button
				variant="outline"
				className={cn(
					"relative h-[22px] gap-0 rounded-full border-gray-300 px-[.35rem] text-xs font-semibold shadow-none",
					withDropdown ? "" : "pr-4"
				)}
			>
				<FlagTriangleRightIcon strokeWidth="1px" className="text-neutral-500" />
				{stage.name}
				{withDropdown && <ChevronDown strokeWidth="1px" />}
				<div
					className={cn("w-0 overflow-hidden transition-all duration-300 ease-in-out", {
						"ml-1 w-[14px]": expanded,
					})}
				/>
			</Button>

			<Button
				variant="ghost"
				onClick={() => {
					setQuery((old) => ({
						...old,
						stages: isSelected
							? old.stages.filter((id) => id !== stage.id)
							: [...old.stages, stage.id],
					}));
				}}
				size="icon"
				className={`absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full text-muted-foreground transition-opacity duration-500 ease-in-out hover:bg-gray-200 hover:text-foreground ${
					expanded ? "opacity-100" : "opacity-0"
				}`}
			>
				{isSelected ? <X size={8} /> : <Plus size={8} />}
			</Button>
		</div>
	);
};
