import { Suspense } from "react";

import type { CommunitiesId, UsersId } from "db/public";
import { cn } from "utils";

import { searchParamsCache } from "~/app/components/DataTable/PubsDataTable/validations";
import { FooterPagination } from "~/app/components/Pagination";
import PubRow, { PubRowSkeleton } from "~/app/components/PubRow";
import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { PubSelector } from "./PubSelector";
import { PubsSelectedProvider } from "./PubsSelectedContext";
import { PubsSelectedCounter } from "./PubsSelectedCounter";

type PaginatedPubListProps = {
	communityId: CommunitiesId;
	searchParams: { [key: string]: string | string[] | undefined };
	/**
	 * Needs to be provided for the pagination to work
	 *
	 * @default `/c/${communitySlug}/pubs`
	 */
	basePath?: string;
	userId: UsersId;
};

const PaginatedPubListInner = async (props: PaginatedPubListProps) => {
	const search = searchParamsCache.parse(props.searchParams);
	const [count, pubs] = await Promise.all([
		getPubsCount({ communityId: props.communityId }),
		getPubsWithRelatedValues(
			{ communityId: props.communityId, userId: props.userId },
			{
				limit: search.perPage,
				offset: (search.page - 1) * search.perPage,
				orderBy: "updatedAt",
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
			}
		),
	]);

	const totalPages = Math.ceil(count / search.perPage);

	const communitySlug = await getCommunitySlug();
	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	return (
		<div className={cn("flex flex-col gap-8")}>
			<PubsSelectedProvider pubIds={[]}>
				{pubs.map((pub) => {
					return (
						<div key={pub.id}>
							<PubRow
								key={pub.id}
								userId={props.userId}
								pub={pub}
								searchParams={props.searchParams}
							/>
							<PubSelector pubId={pub.id} />
						</div>
					);
				})}
				<FooterPagination
					basePath={basePath}
					searchParams={props.searchParams}
					page={search.page}
					totalPages={totalPages}
				>
					<PubsSelectedCounter pageSize={search.perPage} />
				</FooterPagination>
			</PubsSelectedProvider>
		</div>
	);
};

export const PubListSkeleton = ({
	amount = 10,
	className,
}: {
	amount?: number;
	className?: string;
}) => (
	<div className={cn(["flex flex-col gap-8", className])}>
		{Array.from({ length: amount }).map((_, index) => (
			<PubRowSkeleton key={index} />
		))}
	</div>
);

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	return (
		<Suspense fallback={<PubListSkeleton />}>
			<PaginatedPubListInner {...props} />
		</Suspense>
	);
};
