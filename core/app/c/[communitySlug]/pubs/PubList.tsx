import { Suspense } from "react";

import type { CommunitiesId, UsersId } from "db/public";
import { cn } from "utils";

import { BasicPagination } from "~/app/components/Pagination";
import PubRow, { PubRowSkeleton } from "~/app/components/PubRow";
import { getPubsCount, getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";

const PAGE_SIZE = 10;

type PaginatedPubListProps = {
	communityId: CommunitiesId;
	page: number;
	searchParams: Record<string, unknown>;
	/**
	 * Needs to be provided for the pagination to work
	 *
	 * @default `/c/${communitySlug}/pubs`
	 */
	basePath?: string;
	userId: UsersId;
};

const PaginatedPubListInner = async (props: PaginatedPubListProps) => {
	const [count, pubs] = await Promise.all([
		getPubsCount({ communityId: props.communityId }),
		getPubsWithRelatedValuesAndChildren(
			{ communityId: props.communityId, userId: props.userId },
			{
				limit: PAGE_SIZE,
				offset: (props.page - 1) * PAGE_SIZE,
				orderBy: "updatedAt",
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withLegacyAssignee: true,
			}
		),
	]);

	const totalPages = Math.ceil(count / PAGE_SIZE);

	const communitySlug = await getCommunitySlug();
	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	return (
		<div className={cn("flex flex-col gap-8")}>
			{pubs.map((pub) => {
				return (
					<PubRow
						key={pub.id}
						userId={props.userId}
						pub={pub}
						searchParams={props.searchParams}
					/>
				);
			})}
			<BasicPagination
				basePath={basePath}
				searchParams={props.searchParams}
				page={props.page}
				totalPages={totalPages}
			/>
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
