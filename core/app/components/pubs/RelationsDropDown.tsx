"use client"

import type { ProcessedPub } from "contracts"
import type { PubsId } from "db/public"

import { useState } from "react"
import Link from "next/link"
import { skipToken } from "@tanstack/react-query"

import { Badge } from "ui/badge"
import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { ChevronDown } from "ui/icon"
import { Skeleton } from "ui/skeleton"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { client } from "~/lib/api"
import { getPubTitle } from "~/lib/pubs"

type Props = {
	pubId: PubsId
	numRelations: number
}

export const RelationsDropDown = ({ pubId, numRelations }: Props) => {
	const community = useCommunity()
	const [isOpen, setIsOpen] = useState(false)

	const { data, isLoading } = client.pubs.get.useQuery({
		queryKey: ["getPub", pubId],
		queryData: isOpen
			? {
					query: { withRelatedPubs: true, withPubType: true },
					params: { communitySlug: community.slug, pubId },
				}
			: skipToken,
	})

	const relatedPubs = (data?.body.values
		?.filter((v) => v.relatedPub)
		.flatMap((v) => (v.relatedPub ? [v.relatedPub] : [])) ?? []) as ProcessedPub<{
		withRelatedPubs: true
		withPubType: true
	}>[]

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex h-[22px] gap-1 px-2 px-[.35rem] text-xs font-semibold shadow-none"
				>
					<span className="rounded bg-slate-100 px-1 text-[10px]">{numRelations}</span>
					Relations
					<ChevronDown strokeWidth="1px" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="max-h-72 w-[350px] min-w-0 overflow-y-scroll"
				align="start"
			>
				{isLoading ? (
					<Skeleton className="flex flex-col gap-2">
						{Array.from({ length: numRelations - 1 }, (_, index) => (
							<Skeleton key={index} className="h-6" />
						))}
						<Skeleton className="h-4" />
					</Skeleton>
				) : relatedPubs.length > 0 ? (
					<>
						{relatedPubs.map((relatedPub) => {
							return (
								<DropdownMenuItem key={relatedPub.id}>
									<Badge
										variant="secondary"
										className="col-span-2 whitespace-nowrap rounded border-gray-300 px-1 py-0 text-[10px] font-semibold leading-4 tracking-[-.1px]"
									>
										{relatedPub.pubType.name}
									</Badge>
									<div className="truncate">
										<Link
											href={`/c/${community.slug}/pubs/${relatedPub.id}`}
											className="text-xs font-bold"
										>
											{getPubTitle(relatedPub)}
										</Link>
										{/* TODO: pub description */}
									</div>
								</DropdownMenuItem>
							)
						})}
						{relatedPubs.length !== numRelations && (
							<DropdownMenuItem>
								<p className="w-full text-center text-xs font-medium text-muted-foreground">
									{numRelations - relatedPubs.length} related Pubs are not visible
									to you
								</p>
							</DropdownMenuItem>
						)}
					</>
				) : (
					<DropdownMenuItem>
						<p className="w-full text-center text-xs font-medium text-muted-foreground">
							No related Pubs are visible to you
						</p>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
