"use client";
import React, { Fragment } from "react";
import { PubPayload } from "~/lib/types";
import IntegrationActions from "./IntegrationActions";
import { cn } from "utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui";
import { Row, RowContent, RowFooter } from "./Row";

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
								<span className="text-gray-500 mr-2">{group.pubType.name}</span>
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
		<Row>
			<RowContent className="items-stretch flex justify-between">
				<div>
					<div className="text-sm text-gray-500">{props.pub.pubType.name}</div>
					<h3 className="text-md font-semibold">{getTitle(props.pub)}</h3>
				</div>
				<div className="flex items-center justify-between">
					<IntegrationActions pub={props.pub} token={props.token} />
				</div>
			</RowContent>
			<RowFooter className="items-stretch flex justify-between">
				{props.pub.children.length > 0 && (
					<Collapsible>
						<CollapsibleTrigger>
							<div className={cn("text-sm")}>
								{groupPubChildrenByPubType(props.pub.children).map((group) => (
									<em key={group.pubType.id} className={cn("mr-2")}>
										{group.pubType.name} ({group.pubs.length})
									</em>
								))}
							</div>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<ChildHierarchy pub={props.pub} />
						</CollapsibleContent>
					</Collapsible>
				)}
				{props.actions}
			</RowFooter>
		</Row>
	);
};
export default PubRow;
