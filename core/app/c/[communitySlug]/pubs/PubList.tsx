import { Suspense } from "react";

import type { CommunitiesId } from "db/public";
import { cn } from "utils";

import type { GetPubResult } from "~/lib/server";
import type { XOR } from "~/lib/types";
import { BasicPagination } from "~/app/components/Pagination";
import PubRow, { PubRowSkeleton } from "~/app/components/PubRow";
import { getPubs, getPubsCount } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";

const PAGE_SIZE = 10;

type Props = {
	token: string | Promise<string>;
	searchParams: Record<string, unknown>;
} & XOR<{ pubs: GetPubResult[] }, { communityId: CommunitiesId }>;

/**
 * Renders a list pubs
 * You can either pass the pubs directly, or the communityId to get all the pubs in the community
 */
const PubListInner: React.FC<Props> = async (props) => {
	const pubsPromiseMaybe =
		props.pubs ??
		getPubs(
			{ communityId: props.communityId },
			{
				limit: 1000,
				onlyParents: false,
				orderBy: "updatedAt",
			}
		);
	const allPubs = await pubsPromiseMaybe;

	return (
		<div className={cn("flex flex-col gap-8")}>
			{allPubs.map((pub) => {
				return <PubRow key={pub.id} pub={pub} searchParams={props.searchParams} />;
			})}
		</div>
	);
};

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
};

const PaginatedPubListInner = async (props: PaginatedPubListProps) => {
	const [count, pubs] = await Promise.all([
		getPubsCount({ communityId: props.communityId }),
		getPubs(
			{ communityId: props.communityId },
			{ limit: PAGE_SIZE, offset: (props.page - 1) * PAGE_SIZE, orderBy: "updatedAt" }
		),
	]);

	const totalPages = Math.ceil(count / PAGE_SIZE);

	const communitySlug = getCommunitySlug();
	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	return (
		<div className={cn("flex flex-col gap-8")}>
			{pubs.map((pub) => {
				return <PubRow key={pub.id} pub={pub} searchParams={props.searchParams} />;
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

export const PubList: React.FC<Props> = async (props) => {
	return (
		<Suspense fallback={<PubListSkeleton />}>
			<PubListInner {...props} />
		</Suspense>
	);
};

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	return (
		<Suspense fallback={<PubListSkeleton />}>
			<PaginatedPubListInner {...props} />
		</Suspense>
	);
};
