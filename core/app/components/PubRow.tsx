import React, { Fragment } from "react";
import Link from "next/link";

import type { PubsId } from "db/public/Pubs";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { cn } from "utils";

import type { PubPayload } from "~/lib/types";
import IntegrationActions from "./IntegrationActions";
import { PubDropDown } from "./PubCRUD/PubDropDown";
import { PubUpdateButton } from "./PubCRUD/PubUpdateButton";
import { PubTitle } from "./PubTitle";
import { Row, RowContent, RowFooter, RowHeader } from "./Row";

type Props = {
	pub: PubPayload;
	token: string;
	actions?: React.ReactNode;
};

const groupPubChildrenByPubType = (pubs: PubPayload["children"]) => {
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
		{} as { [key: string]: { pubType: PubPayload["pubType"]; pubs: PubPayload["children"] } }
	);
	return Object.values(pubTypes);
};

const getTitle = (pub: PubPayload["children"][number]) => {
	const title = pub.values.find((value) => {
		return value.field.slug === "unjournal:title" || value.field.slug === "pubpub:title";
	});
	return title?.value as string;
};

const ChildHierarchy = ({ pub }: { pub: PubPayload["children"][number] }) => {
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
									href={`/pubs/${child.id}`}
									className="text-sm hover:underline"
								>
									{getTitle(child)}
								</Link>
							</div>
							{pub.children?.length > 0 && <ChildHierarchy pub={child} />}
						</li>
					))}
				</Fragment>
			))}
		</ul>
	);
};

const PubRow: React.FC<Props> = function (props: Props) {
	return (
		<Row className="mb-9">
			<RowHeader>
				<div className="flex flex-row items-center justify-between">
					<div className="text-sm font-semibold text-gray-500">
						{props.pub.pubType.name}
					</div>
					<div className="flex flex-row gap-x-2">
						<IntegrationActions pub={props.pub} token={props.token} />
						<div>{props.actions}</div>
						<PubDropDown pubId={props.pub.id as PubsId} />
					</div>
				</div>
			</RowHeader>
			<RowContent className="flex items-start justify-between">
				<h3 className="text-md font-medium">
					<Link href={`pubs/${props.pub.id}`} className="hover:underline">
						<PubTitle pub={props.pub} />
					</Link>
				</h3>
			</RowContent>
			{props.pub.children.length > 0 && (
				<RowFooter className="flex items-stretch justify-between">
					<Collapsible>
						<CollapsibleTrigger>
							<Button
								asChild
								variant="link"
								size="sm"
								className="flex items-center px-0"
							>
								<span className="mr-1">Contents ({props.pub.children.length})</span>
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<ChildHierarchy pub={props.pub} />
						</CollapsibleContent>
					</Collapsible>
				</RowFooter>
			)}
		</Row>
	);
};
export default PubRow;
