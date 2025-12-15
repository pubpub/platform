"use client"

import type { ProcessedPub } from "contracts"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "ui/command"
import { useKeyboardShortcut } from "ui/hooks"
import { AlertCircle, Loader2 } from "ui/icon"

import { client } from "~/lib/api"
import { useCommunity } from "../providers/CommunityProvider"
import { PubCardClient } from "../pubs/PubCard/PubCardClient"
import { useSearchDialog } from "./SearchDialogContext"

export function SearchDialog() {
	const { isOpen, close, open } = useSearchDialog()
	const [query, setQuery] = useState("")
	const [debouncedQuery] = useDebounce(query, 300)
	const community = useCommunity()

	const {
		data: results = { status: 400, body: [] },
		error,
		isError,
		isFetching,
		isFetched,
	} = client.pubs.getMany.useQuery({
		queryKey: ["pubs", "search", community.id, debouncedQuery],
		queryData: {
			query: {
				search: debouncedQuery,
				depth: 1,
				withPubType: true,
				withSearchValues: true,
				withValues: false,
				withStage: true,
				limit: 10,
				offset: 0,
				orderBy: "updatedAt",
				orderDirection: "desc",
			},
			params: { communitySlug: community.slug },
		},
		enabled: debouncedQuery.length > 0,
		placeholderData: (prev, prevQuery) => {
			if (prevQuery?.state.error || prevQuery?.state.data?.status !== 200) {
				return prevQuery?.state.data
			}
			return prev
		},
	})

	useKeyboardShortcut("Mod+k", open)

	const router = useRouter()

	const handleOpenChange = (newOpen: boolean) => {
		if (newOpen) {
			return
		}
		close()
	}

	return (
		<CommandDialog
			open={isOpen}
			onOpenChange={handleOpenChange}
			title="Search pubs"
			description="Search pubs by title and content"
			shouldFilter={false}
		>
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
				<CommandGroup className={"!px-0 p-0"}>
					{results.status === 200 &&
						(
							results.body as ProcessedPub<{
								withValues: false
								withPubType: true
								withStage: true
							}>[]
						).map((pub) => (
							<CommandItem
								key={pub.id}
								onSelect={() => {
									router.push(`/c/${community.slug}/pubs/${pub.id}`)
									close()
								}}
								className="flex flex-col items-start gap-1 py-3"
								asChild
							>
								<PubCardClient
									pub={pub}
									showCheckbox={false}
									className="rounded-none"
								/>
							</CommandItem>
						))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	)
}
