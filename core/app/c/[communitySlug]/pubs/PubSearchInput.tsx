"use client";

import React, { useDeferredValue, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useDebouncedCallback } from "use-debounce";

import { KeyboardShortcutPriority, useKeyboardShortcut, usePlatformModifierKey } from "ui/hooks";
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

	const handleClearInput = () => {
		setInputValue("");
		setQuery({ query: "", page: 1 });
	};

	// determine if content is stale, in order to provide a visual feedback to the user
	const isStale = inputValue !== deferredQuery;

	return (
		<div className="flex flex-col gap-4">
			<div className="sticky top-0 z-20 flex max-w-md items-center gap-x-2">
				<Search
					className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
					size={16}
				/>
				<Input
					ref={inputRef}
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
						debouncedSetQuery(e.target.value);
					}}
					placeholder="Search updates as you type..."
					className={cn("bg-white pl-8 tracking-wide shadow-none", inputValue && "pr-8")}
				/>
				<span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-x-2 font-mono text-xs text-gray-500 opacity-50 md:flex">
					{inputValue && (
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
			<div className={cn(isStale && "opacity-50 transition-opacity duration-200")}>
				{props.children}
			</div>
		</div>
	);
};
