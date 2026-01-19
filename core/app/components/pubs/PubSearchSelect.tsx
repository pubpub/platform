"use client"

import type { ProcessedPub } from "contracts"
import type { PubsId, PubTypesId } from "db/public"

import { useCallback, useMemo, useRef, useState } from "react"
import { isEnabled } from "@sentry/nextjs"
import { useDebounce } from "use-debounce"

import { AutoComplete } from "ui/autocomplete"

import { client } from "~/lib/api"
import { getPubTitle } from "~/lib/pubs"
import { useCommunity } from "../providers/CommunityProvider"
import { useUser } from "../providers/UserProvider"
import { PubCardClient } from "./PubCard/PubCardClient"

export type PubSearchSelectProps<
	WithValues extends boolean = false,
	WithRelatedPubs extends boolean = false,
> = {
	withValues?: WithValues
	withRelatedPubs?: WithRelatedPubs
	onSelectedPubsChange?: (
		pubs: ProcessedPub<{
			withPubType: true
			withStage: true
			withValues: WithValues
			withRelatedPubs: WithRelatedPubs
		}>[]
	) => void
	disabledPubIds?: PubsId[]
	pubTypeIds?: PubTypesId[]
	mode?: "single" | "multi"
	placeholder?: string
	emptyMessage?: string
	className?: string
	maxHeight?: string
	multiSelect?: boolean
}

export const PubSearchSelect = <
	WithValues extends boolean = false,
	WithRelatedPubs extends boolean = false,
>(
	props: PubSearchSelectProps<WithValues, WithRelatedPubs>
) => {
	const [selectedPubs, setSelectedPubs] = useState<
		ProcessedPub<{
			withPubType: true
			withStage: true
			withValues: WithValues
			withRelatedPubs: WithRelatedPubs
		}>[]
	>([])
	const [query, setQuery] = useState("")
	const [debouncedQuery] = useDebounce(query, 300)
	const community = useCommunity()
	const user = useUser()
	const inputRef = useRef<HTMLInputElement>(null)

	const { data: results } = client.pubs.getMany.useQuery({
		queryKey: ["pubs", "search", community.id, debouncedQuery, props.pubTypeIds],
		queryData: {
			query: {
				limit: 20,
				offset: 0,
				orderBy: "updatedAt",
				orderDirection: "desc",
				pubTypeId: props.pubTypeIds,
				withPubType: true,
				withRelatedPubs: props.withRelatedPubs,
				withStage: true,
				withValues: props.withValues,
				userId: user.user?.id,
			},
			params: { communitySlug: community.slug },
		},
		placeholderData: (prev) => prev,
	})

	const handleClearSearch = useCallback(() => {
		setQuery("")
		inputRef.current?.focus()
	}, [])

	const clear = useCallback(() => {
		handleClearSearch()
		props.onSelectedPubsChange?.([])
		setSelectedPubs([])
	}, [handleClearSearch, props.onSelectedPubsChange])

	const pubs = useMemo(
		() =>
			results?.status === 200
				? (results.body as ProcessedPub<{
						withPubType: true
						withStage: true
						withValues: WithValues
						withRelatedPubs: WithRelatedPubs
					}>[])
				: [],
		[results]
	)

	const options = useMemo(
		() =>
			pubs.map((pub) => ({
				value: pub.id,
				label: getPubTitle(pub as any),
				node: <PubCardClient className="w-full" pub={pub} showCheckbox={false} />,
				className: "p-1",
			})),
		[pubs]
	)

	return (
		<AutoComplete
			value={
				selectedPubs[0]
					? {
							value: selectedPubs[0].id,
							// this is just annoying to get right
							label: getPubTitle(selectedPubs[0] as any),
							node: (
								<PubCardClient
									className="w-full"
									pub={selectedPubs[0]}
									showCheckbox={false}
								/>
							),
						}
					: undefined
			}
			options={options}
			disabled={!isEnabled}
			empty={null}
			onInputValueChange={(val) => {
				setQuery(val)
			}}
			onValueChange={(option) => {
				const pub = pubs.find((p) => p.id === option.value)
				if (!pub) {
					setSelectedPubs([])
					props.onSelectedPubsChange?.([])
					return
				}
				setSelectedPubs([pub])

				props.onSelectedPubsChange?.([pub])
			}}
			onClose={handleClearSearch}
			onClear={clear}
			placeholder={props.placeholder}
		/>
	)
}
