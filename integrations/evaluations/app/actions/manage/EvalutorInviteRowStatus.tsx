import { memo } from "react";

import { Badge } from "ui/badge";
import { cn } from "utils";

import { InviteStatus } from "~/lib/types";

export const getEvaluatorStatusText = (status: InviteStatus) => {
	switch (status) {
		case "unsaved":
		case "unsaved-with-user":
			return "Unsaved";
		case "saved":
			return "Saved";
		case "invited":
			return "Invited";
		case "accepted":
			return "Accepted";
		case "declined":
			return "Declined";
		case "received":
			return "Received";
	}
};

const getEvaluatorStatusColor = (status: InviteStatus) => {
	switch (status) {
		case "unsaved":
		case "unsaved-with-user":
			return ["text-yellow-700", "border-yellow-700"];
		case "saved":
		case "invited":
			return ["text-gray-700", "border-gray-700"];
		case "accepted":
			return ["text-green-700", "border-green-700"];
		case "declined":
			return ["text-red-700", "border-red-700"];
		case "received":
			return "bg-green-700";
	}
};

export const getEvaluatorStatusVariant = (status: InviteStatus) => {
	switch (status) {
		case "unsaved":
		case "unsaved-with-user":
		case "saved":
		case "invited":
		case "accepted":
		case "declined":
			return "outline";
		case "received":
			return "default";
	}
};

export const EvaluatorInviteRowStatus = memo(({ status }: { status: InviteStatus }) => {
	const text = getEvaluatorStatusText(status);
	const color = getEvaluatorStatusColor(status);
	const variant = getEvaluatorStatusVariant(status);
	return (
		<Badge className={cn(color, "px-1 py-0 text-[10px]")} variant={variant}>
			{text}
		</Badge>
	);
});
