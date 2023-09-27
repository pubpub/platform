"use client";

import Link from "next/link";
import React, { Fragment } from "react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui";
import { cn } from "utils";
import { PubPayload } from "~/lib/types";
import IntegrationActions from "./IntegrationActions";
import { PubTitle } from "./PubTitle";
import { Row, RowContent, RowFooter, RowHeader } from "./Row";

type Props = {
	pub: PubPayload;
	token: string;
	actions?: React.ReactNode;
};

const groupPubChildrenByPubType = (pubs: PubPayload["children"]) => {
	const pubTypes = pubs.reduce((prev, curr) => {
		const pubType = curr.pubType;
		if (!prev[pubType.id]) {
			prev[pubType.id] = {
				pubType,
				pubs: [],
			};
		}
		prev[pubType.id].pubs.push(curr);
		return prev;
	}, {} as { [key: string]: { pubType: PubPayload["pubType"]; pubs: PubPayload["children"] } });
	return Object.values(pubTypes);
};

const getTitle = (pub: PubPayload["children"][number]) => {
	const title = pub.values.find((value) => {
		return value.field.name === "Title";
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
								<span className="text-gray-500 mr-2 font-semibold">
									{group.pubType.name}
								</span>
								{getTitle(child)}
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
				<div className="flex flex-row justify-between items-center">
					<div className="text-sm text-gray-500 font-semibold">
						{props.pub.pubType.name}
					</div>
					<div className="flex flex-row">
						<IntegrationActions pub={props.pub} token={props.token} />
						<div className="ml-1">{props.actions}</div>
					</div>
				</div>
			</RowHeader>
			<RowContent className="flex justify-between items-start">
				<h3 className="text-md font-medium">
					<Link href={`pubs/${props.pub.id}`}>
						<PubTitle pub={props.pub} />
					</Link>
				</h3>
			</RowContent>
			{props.pub.children.length > 0 && (
				<RowFooter className="items-stretch flex justify-between">
					<Collapsible>
						<CollapsibleTrigger>
							<Button
								asChild
								variant="link"
								size="sm"
								className="px-0 flex items-center"
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
