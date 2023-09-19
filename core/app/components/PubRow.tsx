"use client";
import React, { Fragment } from "react";
import { PubPayload } from "~/lib/types";
import IntegrationActions from "./IntegrationActions";
import { cn } from "utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui";

type Props = {
	pub: PubPayload;
	token: string;
	stagePubActions?: React.ReactNode;
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
		<dl className={cn("ml-4")}>
			{groupPubChildrenByPubType(pub.children).map((group) => (
				<Fragment key={group.pubType.id}>
					<dt key={group.pubType.id}>
						<strong>{group.pubType.name}</strong>
					</dt>
					<dd>
						<ul>
							{group.pubs.map((child) => (
								<li key={child.id} className={cn("ml-4")}>
									<div>{getTitle(child)}</div>
									{pub.children?.length > 0 && <ChildHierarchy pub={child} />}
								</li>
							))}
						</ul>
					</dd>
				</Fragment>
			))}
		</dl>
	);
};

const PubRow: React.FC<Props> = function (props: Props) {
	return (
		<div className="pt-2 pb-2">
			<div className="flex items-center justify-between">
				<div className="text-sm">{props.pub.pubType.name}</div>
				<IntegrationActions pub={props.pub} token={props.token} />
			</div>
			<div className="mt-0 items-stretch flex justify-between">
				<h3 className="text-md font-semibold">{getTitle(props.pub)}</h3>
				{props.stagePubActions}
			</div>
			{props.pub.children.length > 0 && (
				<Collapsible>
					<CollapsibleTrigger>
						<div>
							<span className={cn("mr-2")}>Contents:</span>
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
		</div>
	);
};
export default PubRow;
