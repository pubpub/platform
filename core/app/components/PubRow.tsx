import React, { Fragment, Suspense } from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import type { XOR } from "~/lib/types";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { PubDropDown } from "./pubs/PubDropDown";
import { PubTitle } from "./PubTitle";
import { Row, RowContent, RowFooter, RowHeader } from "./Row";

type PubRowPub = ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;

type Props = {
	actions?: React.ReactNode;
	searchParams: Record<string, unknown>;
	userId: UsersId;
} & XOR<{ pub: PubRowPub }, { pubId: PubsId; communityId: CommunitiesId }>;

const groupPubChildrenByPubType = (pubs: PubRowPub[]) => {
	const pubTypes = pubs.reduce(
		(prev, curr) => {
			const pubType = curr.pubType;
			if (!prev[pubType.id]) {
				prev[pubType.id] = {
					pubType,
					pubs: [],
				};
			}
			prev[pubType.id].pubs.push(curr);
			return prev;
		},
		{} as {
			[key: string]: {
				pubType: PubRowPub["pubType"];
				pubs: PubRowPub[];
			};
		}
	);
	return Object.values(pubTypes);
};

const ChildHierarchy = ({ pub, communitySlug }: { pub: PubRowPub; communitySlug: string }) => {
	return (
		<ul className={cn("ml-4 text-sm")}>
			{groupPubChildrenByPubType(pub.children).map((group) => (
				<Fragment key={group.pubType.id}>
					{group.pubs.map((child) => (
						<li key={child.id} className={cn("list-none")}>
							<div>
								<span className="mr-2 font-semibold text-gray-500">
									{group.pubType.name}
								</span>
								<Link
									href={`/c/${communitySlug}/pubs/${child.id}`}
									className="text-sm hover:underline"
								>
									{getPubTitle(child)}
								</Link>
							</div>
							{pub.children?.length > 0 && (
								<ChildHierarchy communitySlug={communitySlug} pub={child} />
							)}
						</li>
					))}
				</Fragment>
			))}
		</ul>
	);
};

const PubRow: React.FC<Props> = async (props: Props) => {
	const pub = props.pubId
		? await getPubsWithRelatedValuesAndChildren(
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
	const communitySlug = await getCommunitySlug();

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
				{pub.children.length > 0 && (
					<RowFooter className="flex items-stretch justify-between">
						<Collapsible>
							<CollapsibleTrigger>
								<Button
									asChild
									variant="link"
									size="sm"
									className="flex items-center px-0"
								>
									<span className="mr-1">Contents ({pub.children.length})</span>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<ChildHierarchy communitySlug={communitySlug} pub={pub} />
							</CollapsibleContent>
						</Collapsible>
					</RowFooter>
				)}
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
