"use client"

import type { ProcessedPub } from "contracts"

import { useCallback } from "react"
import Link from "next/link"

import { Card, CardFooter, CardTitle } from "ui/card"
import { Checkbox } from "ui/checkbox"
import { Calendar, History } from "ui/icon"
import { cn } from "utils"

import { BasicMoveButton } from "~/app/c/[communitySlug]/stages/components/BasicMoveButton"
import { formatDateAsMonthDayYear, formatDateAsPossiblyDistance } from "~/lib/dates"
import { getPubTitle } from "~/lib/pubs"
import { useCommunity } from "../../providers/CommunityProvider"

export type PubCardClientPub = Omit<
	ProcessedPub<{ withPubType: true; withStage?: boolean }>,
	"depth" | "communityId" | "values"
>

import { PubTypeLabel } from "./PubTypeLabel"

export type PubCardClientProps = {
	pub: PubCardClientPub
	selected?: boolean
	onSelect?: (pub: PubCardClientPub, selected: boolean) => void
	disabled?: boolean
	showCheckbox?: boolean
	className?: string
	/* should the whole card be a link?*/
	bigLink?: boolean
}

const LINK_AFTER =
	"after:content-[''] after:z-0 after:absolute after:left-0 after:top-0 after:bottom-0 after:right-0"

export const PubCardClient = ({
	pub,
	selected = false,
	onSelect,
	disabled = false,
	showCheckbox = true,
	className,
	bigLink = false,
}: PubCardClientProps) => {
	const matchingValues = pub.matchingValues?.filter((match) => !match.isTitle)
	const showMatchingValues = matchingValues && matchingValues.length !== 0

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (onSelect && !disabled) {
				onSelect(pub, checked)
			}
		},
		[onSelect, disabled, pub]
	)
	const community = useCommunity()

	return (
		<Card
			className={cn(
				"group relative flex flex-row items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 transition-colors",
				selected && "border-blue-500 bg-blue-50",
				disabled && "cursor-not-allowed opacity-50",
				!disabled && onSelect && "cursor-pointer hover:border-gray-300",
				showCheckbox ? "justify-between" : "justify-start",
				className
			)}
			data-testid={`pub-card-${pub.id}`}
		>
			<div className="flex w-full min-w-0 flex-1 flex-col space-y-[6px]">
				<div className="z-10 flex flex-row gap-2 p-0 font-semibold leading-4">
					<PubTypeLabel pubType={pub.pubType} canFilter={false} />
					{pub.stage && <BasicMoveButton name={pub.stage.name} />}
				</div>
				<CardTitle className="text-sm">
					<h3 className="min-w-0 truncate">
						<Link
							href={`/c/${community.slug}/pubs/${pub.id}`}
							className={cn(
								"hover:underline",
								bigLink && LINK_AFTER,
								"focus-within:underline"
							)}
						>
							<div
								className="[&_mark]:bg-yellow-300"
								dangerouslySetInnerHTML={{ __html: getPubTitle(pub) }}
							/>
						</Link>
					</h3>
				</CardTitle>
				{showMatchingValues && (
					<div
						className={cn(
							"grid grid-cols-[minmax(0rem,auto)_minmax(0,1fr)] gap-1 text-gray-500 text-xs",
							"[&_mark]:bg-yellow-200"
						)}
					>
						{matchingValues.map((match, idx) => (
							<>
								<span key={`${idx}-name`} className="font-medium">
									{match.name}:
								</span>
								<span
									key={`${idx}-value`}
									dangerouslySetInnerHTML={{
										__html: match.highlights,
									}}
									className="font-light text-gray-600"
								/>
							</>
						))}
					</div>
				)}
				<CardFooter className="flex gap-2 p-0 text-gray-600 text-xs">
					<div className="flex gap-1" title="Created at">
						<Calendar size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsMonthDayYear(new Date(pub.createdAt))}</span>
					</div>
					<div className="flex gap-1" title="Updated at">
						<History size="16px" strokeWidth="1px" className="text-neutral-500" />
						<span>{formatDateAsPossiblyDistance(new Date(pub.updatedAt))}</span>
					</div>
				</CardFooter>
			</div>
			{showCheckbox && (
				<div className="z-10 shrink-0">
					<Checkbox
						aria-label={`Select pub ${getPubTitle(pub)}`}
						checked={selected}
						onCheckedChange={handleCheckboxChange}
						disabled={disabled}
						className="h-5 w-5 border-neutral-500"
					/>
				</div>
			)}
		</Card>
	)
}
