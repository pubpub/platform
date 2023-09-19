"use client";
import React from "react";
import { PubPayload } from "~/lib/types";
import IntegrationActions from "./IntegrationActions";

type Props = {
	pub: PubPayload;
	token: string;
	stagePubActions?: React.ReactNode;
};

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
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
		</div>
	);
};
export default PubRow;
