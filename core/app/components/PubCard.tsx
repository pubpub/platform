import React from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Calendar, History, Pencil, Play, Trash } from "ui/icon";

import { formatDateAsPossiblyDistance } from "~/lib/dates";
import { getPubTitle } from "~/lib/pubs";

// TODO: https://github.com/pubpub/platform/issues/1200
const PubDescription = ({ pub }: { pub: ProcessedPub }) => {
	return null;
};

const HoverActions = () => {
	return (
		<div className="flex items-center gap-3 text-neutral-500">
			<Button variant="ghost" className="w-6 [&_svg]:size-6">
				<Trash strokeWidth="1px" />
				<span className="sr-only">Delete</span>
			</Button>
			<Button variant="ghost" className="w-6 [&_svg]:size-6">
				<Play strokeWidth="1px" />
			</Button>
			<Button variant="ghost" className="w-6 [&_svg]:size-6">
				<Pencil strokeWidth="1px" />
			</Button>
			<Checkbox className="ml-2 box-content h-4 w-4 border-neutral-500" />
		</div>
	);
};

export const PubCard = async ({
	pub,
	communitySlug,
}: {
	pub: ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;
	communitySlug: string;
}) => {
	return (
		<Card
			className="group flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
			data-testid={`pub-row-${pub.id}`}
		>
			<div className="flex min-w-0 flex-col space-y-[6px]">
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
					<h3 className="min-w-0 truncate">
						<Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className="hover:underline"
						>
							{getPubTitle(pub)}
						</Link>
					</h3>
				</CardTitle>
				<CardDescription className="min-w-0 truncate">
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
			</div>
			<div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<HoverActions />
			</div>
		</Card>
	);
};
