"use client";

import React, { useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useDebouncedCallback } from "use-debounce";

import { usePlatformModifierKey } from "ui/hooks";
import { Input } from "ui/input";
import { cn } from "utils";

type PubSearchProps = React.PropsWithChildren<{}>;

const DEBOUNCE_TIME = 300;

export const PubSearch = (props: PubSearchProps) => {
	const [query, setQuery] = useQueryStates(
		{
			query: parseAsString.withDefault(""),
			page: parseAsInteger.withDefault(1),
		},
		{
			shallow: false,
		}
	);

	// local input state for immediate UI responsiveness + sync with URL
	// otherwise, when navigating back/forward or refreshing, the input will be empty
	const [inputValue, setInputValue] = useState(query.query);

	// deferred query to keep track of server updates
	// without this, we can't only check if inputValue !== query.query,
	// which only tells us that the debounce has happened
	const deferredQuery = useDeferredValue(query.query);

	// sync input with URL when navigating back/forward
	useEffect(() => {
		if (query.query === inputValue) {
			return;
		}
		setInputValue(query.query);
	}, [query.query]);

	const { symbol, platform } = usePlatformModifierKey();

	const debouncedSetQuery = useDebouncedCallback((value: string) => {
		if (value.length >= 2 || value.length === 0) {
			setQuery({ query: value, page: 1 }); // reset to page 1 on new search
		}
	}, DEBOUNCE_TIME);

	// determine if content is stale, in order to provide a visual feedback to the user
	const isStale = inputValue !== deferredQuery;

	return (
		<div className="relative flex flex-col gap-4">
			<div className="sticky top-0 z-20 flex max-w-md items-center gap-x-2">
				<Search
					className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
					size={16}
				/>
				<Input
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
						debouncedSetQuery(e.target.value);
					}}
					placeholder="Search updates as you type..."
					className="bg-white pl-8 tracking-wide shadow-none"
				/>
				<span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-x-1 font-mono text-xs text-gray-500 opacity-50 md:flex">
					<span className={cn(platform === "mac" && "text-lg")}>{symbol}</span> K
				</span>
			</div>
			<div className={cn(isStale && "opacity-50 transition-opacity duration-200")}>
				{props.children}
			</div>
		</div>
	);
};
