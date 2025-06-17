"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useDebouncedCallback } from "use-debounce";

import { usePlatformModifierKey } from "ui/hooks";
import { Input } from "ui/input";
import { cn } from "utils";

type PubSearchProps = React.PropsWithChildren<{}>;

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
	const [value, setValue] = useState(query.query);

	const { symbol, platform } = usePlatformModifierKey();

	const debouncedSetQuery = useDebouncedCallback((value: string) => {
		if (value.length >= 2 || value.length === 0) {
			setQuery({ query: value });
		}
	}, 500);

	return (
		<div className="relative flex flex-col gap-4">
			<div className="sticky top-0 z-20 flex items-center gap-x-2">
				<Search
					className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
					size={16}
				/>
				<Input
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
						debouncedSetQuery(e.target.value);
					}}
					placeholder="Search updates as you type..."
					className="bg-white pl-8 tracking-wide shadow-none"
				/>
				<span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-x-1 font-mono text-xs text-gray-500 opacity-50 md:flex">
					<span className={cn(platform === "mac" && "text-lg")}>{symbol}</span> K
				</span>
			</div>
			<div className={cn(value !== query.query && "opacity-50")}>{props.children}</div>
		</div>
	);
};
