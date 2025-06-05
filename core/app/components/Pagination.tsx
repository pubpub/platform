import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "ui/pagination";

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

export const FooterPagination = () => {
	return (
		<div className="absolute bottom-0 left-0 flex w-full items-center justify-between border-t border-gray-300 bg-white px-4 py-2 text-sm shadow-[4px_0px_10px_-1px_rgba(0,0,0,0.2)]">
			<div>Results per page</div>
			<div>
				Page 1 of 47 <PaginationNext href="" />{" "}
			</div>
			<div>0 of 10 pub(s) selected</div>
		</div>
	);
};
