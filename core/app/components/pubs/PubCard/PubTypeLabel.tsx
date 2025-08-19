"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useQueryStates } from "nuqs";

import type { PubTypesId } from "db/public";
import { Button } from "ui/button";
import { cn } from "utils";

import { pubSearchParsers } from "~/app/c/[communitySlug]/pubs/pubQuery";

export const PubTypeLabel = ({
	pubType,
	canFilter,
}: {
	pubType: {
		id: PubTypesId;
		name: string;
	};
	canFilter?: boolean;
}) => {
	if (!canFilter) {
		<Button
			variant="outline"
			className="h-[22px] rounded border-gray-300 bg-gray-100 px-[.35rem] text-xs font-semibold shadow-none"
		>
			{pubType.name}
		</Button>;
	}

	return <FilterablePubTypeLabel pubType={pubType} />;
};

export const FilterablePubTypeLabel = ({
	pubType,
}: {
	pubType: {
		id: PubTypesId;
		name: string;
	};
}) => {
	const [query, setQuery] = useQueryStates(pubSearchParsers, {
		shallow: false,
	});
	const [expanded, setExpanded] = useState(false);

	const currentPubTypes = query.pubTypes ?? [];

	const isSelected = currentPubTypes.includes(pubType.id);

	return (
		<Button
			variant="outline"
			className={cn(
				"h-[22px] gap-0 rounded border-gray-300 bg-gray-100 px-[.35rem] text-xs font-semibold shadow-none"
			)}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
			onClick={() => {
				setQuery((old) => ({
					...old,
					pubTypes: isSelected
						? old.pubTypes.filter((id) => id !== pubType.id)
						: [...old.pubTypes, pubType.id],
				}));
			}}
		>
			<span className="transition-transform duration-200">{pubType.name}</span>
			<div
				className={cn("w-0 overflow-hidden transition-all duration-300 ease-in-out", {
					"ml-1 w-[14px]": expanded,
				})}
			>
				<div
					className={`text-muted-foreground transition-opacity duration-500 ease-in-out hover:text-foreground ${
						expanded ? "opacity-100" : "opacity-0"
					}`}
				>
					{isSelected ? <X size={14} /> : <Plus size={14} />}
				</div>
			</div>
		</Button>
	);
};
