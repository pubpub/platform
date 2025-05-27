import React from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Calendar, History } from "ui/icon";

import { formatDateAsPossiblyDistance } from "~/lib/dates";
import { PubTitle } from "./PubTitle";

const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return 'TODO We organized two evaluations of the paper: "The animal welfare cost of meat: evidence from a survey of hypotheti...';
};

export const PubCard = async ({
	pub,
	communitySlug,
	actions,
}: {
	pub: ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;
	communitySlug: string;
	actions?: React.ReactNode;
}) => {
	return (
		<Card
			className="flex flex-col space-y-[6px] rounded-md border border-gray-200 bg-white px-3 py-2"
			data-testid={`pub-row-${pub.id}`}
		>
			<div className="flex flex-row gap-2 p-0 text-xs font-semibold leading-4">
				<Badge variant="outline" className="h-[22px] rounded">
					Submission
				</Badge>
				<Button variant="outline" className="h-[22px] rounded-[104px] text-xs">
					Stage
				</Button>
				<Button variant="outline" className="h-[22px] text-xs">
					Relations
				</Button>
			</div>
			<CardTitle className="text-[15px] font-bold">
				<h3>
					<Link
						href={`/c/${communitySlug}/pubs/${pub.id}`}
						className="truncate hover:underline"
					>
						<PubTitle pub={pub} />
					</Link>
				</h3>
			</CardTitle>
			<CardDescription className="truncate">
				<PubDescription pub={pub} />
			</CardDescription>
			<CardFooter className="flex gap-2 p-0 text-xs text-gray-600">
				<div className="flex gap-1" title="Created at">
					<Calendar size="16px" strokeWidth="1px" />
					<span>{formatDateAsPossiblyDistance(pub.createdAt)}</span>
				</div>
				<div className="flex gap-1" title="Updated at">
					<History size="16px" strokeWidth="1px" />
					<span>{formatDateAsPossiblyDistance(pub.updatedAt)}</span>
				</div>
			</CardFooter>
		</Card>
	);
};
