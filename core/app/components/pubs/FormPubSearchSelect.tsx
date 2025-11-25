"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useDebounce } from "use-debounce";

import type { NonGenericProcessedPub, ProcessedPub } from "contracts";
import type { PubsId, PubTypesId } from "db/public";
import { Loader2 } from "ui/icon";
import { Input } from "ui/input";
import { cn } from "utils";

import { client } from "~/lib/api";
import { useCommunity } from "../providers/CommunityProvider";
import { PubCardClient } from "./PubCard/PubCardClient";

export type FormPubSearchSelectProps = {
	formSlug: string;
	fieldSlug: string;
	currentPubId?: PubsId;
	selectedPubs?: NonGenericProcessedPub[];
	onSelectedPubsChange?: (pubs: NonGenericProcessedPub[]) => void;
	disabledPubIds?: PubsId[];
	pubTypeIds?: PubTypesId[];
	mode?: "single" | "multi";
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
	maxHeight?: string;
};

export const FormPubSearchSelect = ({
	formSlug,
	fieldSlug,
	currentPubId,
	selectedPubs = [],
	onSelectedPubsChange,
	disabledPubIds = [],
	pubTypeIds,
	mode = "multi",
	placeholder = "Search pubs...",
	emptyMessage = "No pubs found",
	className,
	maxHeight = "600px",
}: FormPubSearchSelectProps) => {
	const [query, setQuery] = useState("");
	const [debouncedQuery] = useDebounce(query, 300);
	const community = useCommunity();
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		data: results,
		isFetching,
		isError,
	} = useQuery({
		queryKey: ["forms", "pubs", formSlug, fieldSlug, debouncedQuery, pubTypeIds, currentPubId],
		queryFn: async () => {
			if (!debouncedQuery) {
				return client.forms.getPubsForFormField.query({
					query: {
						limit: 20,
						offset: 0,
						orderBy: "updatedAt",
						orderDirection: "desc",
						pubTypeId: pubTypeIds,
						withPubType: true,
						withRelatedPubs: false,
						withStage: true,
						withValues: false,
						currentPubId,
					},
					params: {
						communitySlug: community.slug,
						formSlug,
						fieldSlug,
					},
				});
			}

			const searchResults = await client.pubs.search.query({
				query: { query: debouncedQuery },
				params: { communitySlug: community.slug },
			});

			if (searchResults.status !== 200 || !pubTypeIds || pubTypeIds.length === 0) {
				return searchResults;
			}

			return {
				...searchResults,
				body: searchResults.body.filter((pub) => pubTypeIds.includes(pub.pubType.id)),
			};
		},
		placeholderData: (prev) => prev,
	});

	const handlePubSelect = useCallback(
		(pub: NonGenericProcessedPub, isSelected: boolean) => {
			if (!onSelectedPubsChange) {
				return;
			}

			if (mode === "single") {
				onSelectedPubsChange(isSelected ? [pub] : []);
				return;
			}

			if (isSelected) {
				onSelectedPubsChange([...selectedPubs, pub]);
			} else {
				onSelectedPubsChange(selectedPubs.filter((p) => p.id !== pub.id));
			}
		},
		[mode, selectedPubs, onSelectedPubsChange]
	);

	const handleClearSearch = () => {
		setQuery("");
		inputRef.current?.focus();
	};

	const pubs =
		results?.status === 200
			? (results.body as ProcessedPub<{
					withPubType: true;
					withStage: true;
					withValues: false;
					withRelatedPubs: false;
				}>[])
			: [];
	const showEmpty = !isFetching && pubs.length === 0;
	const showLoading = isFetching && pubs.length === 0;

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="relative flex items-center gap-x-2">
				<Search
					className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
					size={16}
				/>
				<Input
					ref={inputRef}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={placeholder}
					className="bg-white pl-8 pr-8"
				/>
				{query && (
					<button
						onClick={handleClearSearch}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						type="button"
						aria-label="Clear search"
					>
						<X size={14} />
					</button>
				)}
			</div>

			<div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight }}>
				{showLoading && (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
					</div>
				)}

				{showEmpty && (
					<div className="flex items-center justify-center py-8 text-sm text-gray-500">
						{emptyMessage}
					</div>
				)}

				{isError && (
					<div className="flex items-center justify-center py-8 text-sm text-destructive">
						Error loading pubs
					</div>
				)}

				{pubs.map((pub) => {
					const isSelected = selectedPubs.some((p) => p.id === pub.id);
					const isDisabled = disabledPubIds.includes(pub.id);

					return (
						<PubCardClient
							key={pub.id}
							pub={pub}
							selected={isSelected}
							onSelect={handlePubSelect}
							disabled={isDisabled}
							showCheckbox={mode === "multi"}
						/>
					);
				})}
			</div>

			{selectedPubs.length > 0 && (
				<div className="border-t pt-2 text-sm text-gray-600">
					{mode === "multi"
						? `${selectedPubs.length} pub${selectedPubs.length === 1 ? "" : "s"} selected`
						: "1 pub selected"}
				</div>
			)}
		</div>
	);
};
