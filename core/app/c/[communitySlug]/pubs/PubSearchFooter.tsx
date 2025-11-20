"use client"

import { Label } from "ui/label"
import {
	Pagination,
	PaginationContent,
	PaginationFirst,
	PaginationLast,
	PaginationNext,
	PaginationPrevious,
} from "ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { cn } from "utils"

import { usePubSearch } from "./PubSearchProvider"

export const PubSearchFooter = (
	props: {
		basePath: string
		searchParams: Record<string, unknown>
		page: number
		children?: React.ReactNode
		className?: string
	} & (
		| {
				mode: "total"
				totalPages: number
		  }
		| {
				mode: "cursor"
				hasNextPage: boolean
		  }
	)
) => {
	const { setInputValues } = usePubSearch()

	const { basePath, searchParams, page, children, className } = props

	const prevDisabled = page <= 1
	const nextDisabled = props.mode === "total" ? page >= props.totalPages : !props.hasNextPage
	const showLastButton = props.mode === "total"

	return (
		<div
			className={cn(
				"absolute bottom-0 left-0 flex w-full flex-col items-center justify-between gap-2 border-t border-gray-300 bg-white px-4 py-2 text-sm leading-[19px] shadow-[4px_0px_10px_-1px_rgba(0,0,0,0.2)] md:flex-row",
				className
			)}
		>
			<PubSearchResultsPerPageInput />
			<Pagination
				className={cn("items-center gap-2 lg:gap-8", { "mx-0 justify-end": !children })}
			>
				{props.mode === "total" ? (
					<span className="whitespace-nowrap">
						Page {page} of {props.totalPages}
					</span>
				) : (
					<span className="whitespace-nowrap">Page {page}</span>
				)}

				<PaginationContent className="gap-2">
					<PaginationFirst
						iconOnly
						aria-disabled={prevDisabled}
						tabIndex={prevDisabled ? -1 : undefined}
						className={cn("border px-3 py-3", {
							"pointer-events-none opacity-50": prevDisabled,
						})}
						href={{
							pathname: basePath,
							query: { ...searchParams, page: 1 },
						}}
						onClick={() => {
							setInputValues((old) => ({ ...old, page: 1 }))
						}}
					/>
					<PaginationPrevious
						iconOnly
						aria-disabled={prevDisabled}
						tabIndex={prevDisabled ? -1 : undefined}
						className={cn("border px-3 py-3", {
							"pointer-events-none opacity-50": prevDisabled,
						})}
						href={{
							pathname: basePath,
							query: { ...searchParams, page: page - 1 },
						}}
						onClick={() => {
							setInputValues((old) => ({ ...old, page: page - 1 }))
						}}
					/>
					<PaginationNext
						iconOnly
						aria-disabled={nextDisabled}
						tabIndex={nextDisabled ? -1 : undefined}
						className={cn("border px-3 py-3", {
							"pointer-events-none opacity-50": nextDisabled,
						})}
						href={{
							pathname: basePath,
							query: { ...searchParams, page: page + 1 },
						}}
						onClick={() => {
							setInputValues((old) => ({ ...old, page: page + 1 }))
						}}
					/>
					{showLastButton && (
						<PaginationLast
							iconOnly
							aria-disabled={nextDisabled}
							tabIndex={nextDisabled ? -1 : undefined}
							className={cn("border px-3 py-3", {
								"pointer-events-none opacity-50": nextDisabled,
							})}
							href={{
								pathname: basePath,
								query: { ...searchParams, page: props.totalPages },
							}}
							onClick={() => {
								setInputValues((old) => ({ ...old, page: props.totalPages }))
							}}
						/>
					)}
				</PaginationContent>
			</Pagination>
			{children}
		</div>
	)
}

const PAGE_OPTIONS = [10, 25, 50, 100]

export const PubSearchResultsPerPageInput = () => {
	const { queryParams, setFilters } = usePubSearch()

	return (
		<div className="flex items-center gap-2 whitespace-nowrap">
			<Label htmlFor="pagination-per-page" className="font-normal">
				Results per page:
			</Label>
			<Select
				value={`${queryParams.perPage}`}
				onValueChange={(value) => {
					setFilters((old) => ({
						...old,
						perPage: parseInt(value, 10),
						// go back to first page, bc results are messed up
						// could theoreticallly do some more complex calculation, but i dont wanna
						page: 1,
					}))
				}}
			>
				<SelectTrigger className="h-8 w-[4.5rem]">
					<SelectValue placeholder={queryParams.perPage} />
				</SelectTrigger>
				<SelectContent side="top">
					{PAGE_OPTIONS.map((pageSize) => (
						<SelectItem key={pageSize} value={`${pageSize}`}>
							{pageSize}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
