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
}) => {
	return (
		<Pagination>
			<PaginationContent>
				{props.page > 1 && (
					<PaginationItem>
						<PaginationPrevious
							href={{
								// pathname: props.basePath,
								query: { ...props.searchParams, page: props.page - 1 },
							}}
						/>
					</PaginationItem>
				)}

				{props.page > 2 && (
					<PaginationItem>
						<PaginationLink
							href={{
								// pathname: props.basePath,
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
								// pathname: props.basePath,
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
							// pathname: props.basePath,
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
								// pathname: props.basePath,
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
								// pathname: props.basePath,
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
								// pathname: props.basePath,
								query: { ...props.searchParams, page: props.page + 1 },
							}}
						/>
					</PaginationItem>
				)}
			</PaginationContent>
		</Pagination>
	);
};
