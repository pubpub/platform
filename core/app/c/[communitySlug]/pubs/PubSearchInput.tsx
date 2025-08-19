"use client";

import React, {
	use,
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ArrowUpDownIcon, PlusCircle, Search, SortAsc, SortDesc, X } from "lucide-react";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from "nuqs";
import { useDebouncedCallback } from "use-debounce";

import type { PubTypesId, StagesId } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { KeyboardShortcutPriority, useKeyboardShortcut, usePlatformModifierKey } from "ui/hooks";
import { Input } from "ui/input";
import { MultiSelect } from "ui/multi-select";
import { cn } from "utils";

import type { PubSearchParams } from "./pubQuery";
import { entries } from "~/lib/mapping";
import { pubSearchParsers } from "./pubQuery";

export type StageFilters = {
	id: StagesId;
	name: string;
}[];

export type TypeFilters = {
	id: PubTypesId;
	name: string;
}[];

export type PubSearchFilters = {
	default: {
		stage?: StageFilters;
		type?: TypeFilters;
	};
	available: {
		stage: Promise<StageFilters>;
		type: Promise<TypeFilters>;
	};
};

export type PubSearchProps = React.PropsWithChildren<{
	filters: PubSearchFilters;
}>;

const sorts = {
	updatedAt: "Updated",
	createdAt: "Created",
	title: "Title",
};

const DEBOUNCE_TIME = 300;

const isStale = (query: PubSearchParams, inputValues: PubSearchParams) => {
	if (query.query !== inputValues.query) {
		return true;
	}

	const sort = query.sort[0];
	if (sort.id !== inputValues.sort[0]?.id || sort.desc !== inputValues.sort[0]?.desc) {
		return true;
	}

	if (query.page !== inputValues.page) {
		return true;
	}

	if (query.perPage !== inputValues.perPage) {
		return true;
	}

	if (query.pubTypes) {
		const currentPubTypesSet = new Set(query.pubTypes);
		const inputPubTypesSet = new Set(inputValues.pubTypes);

		if (
			currentPubTypesSet.difference(inputPubTypesSet).size !== 0 ||
			inputPubTypesSet.difference(currentPubTypesSet).size !== 0
		) {
			return true;
		}
	}

	if (query.stages) {
		const currentStagesSet = new Set(query.stages);
		const inputStagesSet = new Set(inputValues.stages);

		if (
			currentStagesSet.difference(inputStagesSet).size !== 0 ||
			inputStagesSet.difference(currentStagesSet).size !== 0
		) {
			return true;
		}
	}

	if (query.filters) {
		for (const [idx, filter] of Object.entries(query.filters)) {
			const inputFilter = inputValues.filters[Number(idx)];

			if (
				inputFilter.id !== filter.id ||
				inputFilter.operator !== filter.operator ||
				inputFilter.value !== filter.value
			) {
				return true;
			}
		}
	}

	return false;
};

export const PubSearch = (props: PubSearchProps) => {
	const [query, setQuery] = useQueryStates(pubSearchParsers, {
		shallow: false,
	});

	const availablePubTypes = use(props.filters.available.type);
	const availableStages = use(props.filters.available.stage);

	// local input state for immediate UI responsiveness + sync with URL
	// otherwise, when navigating back/forward or refreshing, the input will be empty
	const [inputValues, setInputValues] = useState(query);

	// deferred query to keep track of server updates
	// without this, we cant only compare eg inputValues.query with query.query,
	// which only tells us that the debounce has happened
	const deferredQuery = useDeferredValue(query);

	const inputRef = useRef<HTMLInputElement>(null);

	useKeyboardShortcut(
		"Mod+k",
		() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		},
		{
			priority: KeyboardShortcutPriority.MEDIUM,
		}
	);

	const currentPubTypes = availablePubTypes?.filter((type) => query.pubTypes?.includes(type.id));
	const currentStages = availableStages?.filter((stage) => query.stages?.includes(stage.id));

	const stale = isStale(deferredQuery, inputValues);

	// sync input with URL when navigating back/forward
	useEffect(() => {
		// if (isStale(query, inputValues)) {
		// 	return;
		// }
		setInputValues(query);
	}, []);

	const { symbol, platform } = usePlatformModifierKey();

	const debouncedSetQuery = useDebouncedCallback((value: string) => {
		if (value.length >= 2 || value.length === 0) {
			setQuery({ query: value, page: 1 }); // reset to page 1 on new search
		}
	}, DEBOUNCE_TIME);

	const setQueryAndInputValues = useCallback((newQuery: Partial<PubSearchParams>) => {
		setQuery((old) => ({ ...old, ...newQuery }));
		setInputValues((old) => ({ ...old, ...newQuery }));
	}, []);

	const handleClearInput = () => {
		setInputValues((old) => ({
			...old,
			query: "",
		}));
		setQuery((old) => ({ ...old, query: "", page: 1 }));
	};

	// determine if content is stale, in order to provide a visual feedback to the user

	return (
		<div className="flex flex-col gap-4">
			<div className="sticky top-0 z-20 mt-0 flex w-full items-center gap-x-2 border-b bg-white px-4 py-2">
				<div className="relative flex min-w-96 items-center gap-x-2">
					<Search
						className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
						size={16}
					/>
					<Input
						ref={inputRef}
						value={inputValues?.query}
						onChange={(e) => {
							setInputValues((old) => ({
								...old,
								query: e.target.value,
							}));
							debouncedSetQuery(e.target.value);
						}}
						placeholder="Search updates as you type..."
						className={cn(
							"bg-white pl-8 tracking-wide shadow-none",
							inputValues && "pr-8"
						)}
					/>
					<span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center font-mono text-xs text-gray-500 opacity-50 md:flex">
						{inputValues?.query && (
							<button
								onClick={handleClearInput}
								className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:right-16"
								type="button"
								aria-label="Clear search"
							>
								<X size={14} />
							</button>
						)}
						<span
							className={cn(
								"flex w-10 items-center justify-center gap-x-1 transition-opacity duration-200",
								{
									// hide until hydrated, otherwise you see flash of `Ctrl` -> `Cmd` on mac
									"opacity-0": platform === "unknown",
								}
							)}
						>
							<span className={cn({ "mt-0.5 text-lg": platform === "mac" })}>
								{symbol}
							</span>{" "}
							K
						</span>
					</span>
				</div>
				<MultiSelect
					options={availablePubTypes?.map((type) => ({
						label: type.name,
						value: type.id,
					}))}
					defaultValue={currentPubTypes?.map((type) => type.id)}
					onValueChange={(items) => setQueryAndInputValues({ pubTypes: items })}
					showClearAll
					value={query.pubTypes ?? []}
					asChild
				>
					<Button variant="outline" size="sm">
						<PlusCircle size={16} />
						Type
						{currentPubTypes?.length ? (
							<span className="ml-1 text-xs text-gray-500">
								{currentPubTypes.length}
							</span>
						) : null}
					</Button>
				</MultiSelect>
				<MultiSelect
					options={availableStages?.map((stage) => ({
						label: stage.name,
						value: stage.id,
					}))}
					defaultValue={currentStages?.map((stage) => stage.id)}
					onValueChange={(items) => setQueryAndInputValues({ stages: items })}
					value={query.stages ?? []}
					showClearAll
					asChild
				>
					<Button variant="outline" size="sm">
						<PlusCircle size={16} />
						Stage
						{currentStages?.length ? (
							<span className="ml-1 text-xs text-gray-500">
								{currentStages.length}
							</span>
						) : null}
					</Button>
				</MultiSelect>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="ml-auto">
							{query.sort ? (
								query.sort[0]?.desc ? (
									<SortDesc />
								) : (
									<SortAsc />
								)
							) : (
								<ArrowUpDownIcon />
							)}
							{query.sort ? sorts[query.sort[0]?.id as keyof typeof sorts] : "Sort"}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{entries(sorts).map(([key, label]) => (
							<DropdownMenuItem
								key={key}
								onClick={() =>
									setQueryAndInputValues({
										sort: [{ id: key, desc: !query.sort[0]?.desc }],
									})
								}
							>
								{label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className={cn(stale && "opacity-50 transition-opacity duration-200", "m-4 mt-1")}>
				{props.children}
			</div>
		</div>
	);
};
