import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "ui/pagination";
import { cn } from "utils";

import { ResultsPerPageInput } from "./ResultsPerPageInput";

export const BasicPagination = (props: {
	basePath: string;
	searchParams: Record<string, unknown>;
	page: number;
	totalPages: number;
	/**
	 * @default true
	 */
	hideIfSinglePage?: boolean;
}) => {
	if (props.hideIfSinglePage !== false && props.totalPages === 1) {
		return null;
	}

	return (
		<Pagination>
			<PaginationContent>
				{props.page > 1 && (
					<PaginationItem>
						<PaginationPrevious
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: props.page - 1 },
							}}
						/>
					</PaginationItem>
				)}

				{props.page > 2 && (
					<PaginationItem>
						<PaginationLink
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: 1 },
							}}
						>
							1
						</PaginationLink>
					</PaginationItem>
				)}

				{props.page > 3 && (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				)}

				{props.page > 1 && (
					<PaginationItem>
						<PaginationLink
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: props.page - 1 },
							}}
						>
							{props.page - 1}
						</PaginationLink>
					</PaginationItem>
				)}

				<PaginationItem>
					<PaginationLink
						href={{
							pathname: props.basePath,
							query: { ...props.searchParams, page: props.page },
						}}
						isActive
					>
						{props.page}
					</PaginationLink>
				</PaginationItem>

				{props.page < props.totalPages && (
					<PaginationItem>
						<PaginationLink
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: props.page + 1 },
							}}
						>
							{props.page + 1}
						</PaginationLink>
					</PaginationItem>
				)}

				{props.page < props.totalPages - 2 && (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				)}

				{props.page < props.totalPages - 1 && (
					<PaginationItem>
						<PaginationLink
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: props.totalPages },
							}}
						>
							{props.totalPages}
						</PaginationLink>
					</PaginationItem>
				)}

				{props.page < props.totalPages && (
					<PaginationItem>
						<PaginationNext
							href={{
								pathname: props.basePath,
								query: { ...props.searchParams, page: props.page + 1 },
							}}
						/>
					</PaginationItem>
				)}
			</PaginationContent>
		</Pagination>
	);
};

export const FooterPagination = ({
	basePath,
	searchParams,
	page,
	totalPages,
	children,
}: {
	basePath: string;
	searchParams: Record<string, unknown>;
	page: number;
	totalPages: number;
	children?: React.ReactNode;
}) => {
	const nextDisabled = page >= totalPages;
	const prevDisabled = page <= 1;
	return (
		<div className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-between gap-2 border-t border-gray-300 bg-white px-4 py-2 text-sm leading-[19px] shadow-[4px_0px_10px_-1px_rgba(0,0,0,0.2)] md:flex-row">
			<ResultsPerPageInput />
			<Pagination
				className={cn("items-center gap-2 lg:gap-8", { "mx-0 justify-end": !children })}
			>
				<span className="whitespace-nowrap">
					Page {page} of {totalPages}
				</span>

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
					/>
					<PaginationLast
						iconOnly
						aria-disabled={nextDisabled}
						tabIndex={nextDisabled ? -1 : undefined}
						className={cn("border px-3 py-3", {
							"pointer-events-none opacity-50": nextDisabled,
						})}
						href={{
							pathname: basePath,
							query: { ...searchParams, page: totalPages },
						}}
					/>
				</PaginationContent>
			</Pagination>
			{children}
		</div>
	);
};
