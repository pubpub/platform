import { Suspense } from "react";

import type { CommunitiesId } from "db/public";
import { cn } from "utils";

import type { GetPubResult } from "~/lib/server";
import type { XOR } from "~/lib/types";
import PubRow, { PubRowSkeleton } from "~/app/components/PubRow";
import { getPubs } from "~/lib/server";

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
			}
		);
	const [allPubs, token] = await Promise.all([pubsPromiseMaybe, props.token]);

	return (
		<div className={cn("flex flex-col gap-8")}>
			{allPubs.map((pub) => {
				return (
					<PubRow
						key={pub.id}
						pub={pub}
						token={token}
						searchParams={props.searchParams}
					/>
				);
			})}
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

const PubList: React.FC<Props> = async (props) => {
	return (
		<Suspense fallback={<PubListSkeleton />}>
			<PubListInner {...props} />
		</Suspense>
	);
};

export default PubList;
