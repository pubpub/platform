import React, { Suspense } from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { XOR } from "~/lib/types";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { PubDropDown } from "./pubs/PubDropDown";
import { PubTitle } from "./PubTitle";
import { Row, RowContent, RowHeader } from "./Row";

type PubRowPub = ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;

type Props = {
	actions?: React.ReactNode;
	searchParams: Record<string, unknown>;
	userId: UsersId;
} & XOR<{ pub: PubRowPub }, { pubId: PubsId; communityId: CommunitiesId }>;

const PubRow: React.FC<Props> = async (props: Props) => {
	const pub = props.pubId
		? await getPubsWithRelatedValues(
				{ pubId: props.pubId, communityId: props.communityId, userId: props.userId },
				{
					withPubType: true,
					withRelatedPubs: false,
					withStage: true,
				}
			)
		: props.pub;
	if (!pub) {
		return null;
	}
	const communitySlug = await await getCommunitySlug();

	return (
		<>
			<Row data-testid={`pub-row-${pub.id}`}>
				<RowHeader>
					<div className="flex flex-row items-center justify-between">
						<div className="text-sm font-semibold text-gray-500">
							{pub.pubType.name}
						</div>
						<div className="flex flex-row gap-x-2">
							<div>{props.actions}</div>
							<PubDropDown pubId={pub.id} searchParams={props.searchParams} />
						</div>
					</div>
				</RowHeader>
				<RowContent className="flex items-start justify-between">
					<h3 className="text-md font-medium">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className="hover:underline"
						>
							<PubTitle pub={pub} />
						</Link>
					</h3>
				</RowContent>
			</Row>
		</>
	);
};

export const PubRowSkeleton = () => (
	<Skeleton className="flex h-[90px] w-full flex-col gap-2 px-4 py-3">
		<Skeleton className="mt-3 h-6 w-24 space-y-1.5" />
		<Skeleton className="h-8 w-1/2 space-y-1.5" />
	</Skeleton>
);

const PubRowWithFallBack = (props: Props) => (
	<Suspense fallback={<PubRowSkeleton />}>
		<PubRow {...props} />
	</Suspense>
);

export default PubRowWithFallBack;
