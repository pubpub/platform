"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "ui/command";
import { KeyboardShortcutPriority, useKeyboardShortcut } from "ui/hooks";
import { AlertCircle, Loader2 } from "ui/icon";

import type { fullTextSearch } from "~/lib/server/pub";
import { client } from "~/lib/api";
import { getPubTitle } from "~/lib/pubs";
import { useCommunity } from "./providers/CommunityProvider";

interface SearchDialogProps {
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	onPubSelect?: (pub: any) => void;
}

export function SearchDialog({ defaultOpen, onOpenChange, onPubSelect }: SearchDialogProps) {
	const [open, setOpen] = useState(defaultOpen);
	const [query, setQuery] = useState("");
	const [debouncedQuery] = useDebounce(query, 300);
	const community = useCommunity();

	const {
		data: results = { status: 400, body: [] },
		error,
		isError,
		isFetching,
	} = useQuery({
		queryKey: ["pubs", "search", community.id, debouncedQuery],
		queryFn: () =>
			client.pubs.search.query({
				query: { query: debouncedQuery },
				params: { communitySlug: community.slug },
			}),
		enabled: debouncedQuery.length > 0,
		placeholderData: (prev, prevQuery) => {
			if (prevQuery?.state.error || prevQuery?.state.data?.status !== 200) {
				return prevQuery?.state.data;
			}
			return prev;
		},
	});

	useKeyboardShortcut("Mod+k", () => {
		onOpenChange?.(true);
		setOpen(true);
	});

	const router = useRouter();

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Search pubs"
			description="Search pubs by title and content"
		>
			<Command shouldFilter={false}>
				<CommandInput placeholder="Search pubs..." value={query} onValueChange={setQuery} />
				<CommandList>
					{results.status === 200 && results.body.length === 0 && (
						<CommandEmpty className="flex w-full flex-col items-center p-6">
							{isFetching ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : isError ? (
								<AlertCircle className="h-4 w-4" />
							) : (
								"No results found"
							)}
						</CommandEmpty>
					)}
					<CommandGroup>
						{results.status === 200 &&
							results.body.map(
								(pub: Awaited<ReturnType<typeof fullTextSearch>>[number]) => (
									<CommandItem
										key={pub.id}
										onSelect={() => {
											router.push(`/c/${community.slug}/pubs/${pub.id}`);
											setOpen(false);
										}}
										className="flex flex-col items-start gap-1 py-3"
									>
										<div className="flex gap-2 text-xs font-medium text-gray-700">
											<span>{pub.pubType.name}</span>
											{pub.stage && (
												<>
													<span>•</span>
													<span>{pub.stage.name}</span>
												</>
											)}
										</div>
										<div
											className="text-sm font-medium"
											dangerouslySetInnerHTML={{
												__html: pub.titleHighlights || getPubTitle(pub),
											}}
										/>

										{/* Matching values that aren't titles */}
										{pub.matchingValues
											.filter((match) => !match.isTitle)
											.map((match, idx) => (
												<div
													key={idx}
													className="flex gap-2 text-xs text-gray-500"
												>
													<span className="font-medium">
														{match.name}:
													</span>
													<span
														dangerouslySetInnerHTML={{
															__html: match.highlights,
														}}
														className="text-gray-600"
													/>
												</div>
											))}
									</CommandItem>
								)
							)}
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}
