import { memo } from "react";
import { Badge } from "ui";
import { cn } from "utils";
import { InviteStatus } from "~/lib/types";

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

export const EvaluatorInviteRowStatus = memo(({ status }: { status: InviteStatus }) => {
	const color = getEvaluatorStatusColor(status);
	switch (status) {
		case "unsaved":
		case "unsaved-with-user":
			return (
				<Badge className={cn(color, "text-[10px] px-1 py-0")} variant="outline">
					Unsaved
				</Badge>
			);
		case "saved":
			return (
				<Badge className={cn(color, "text-[10px] px-1 py-0")} variant="outline">
					Saved
				</Badge>
			);
		case "invited":
			return (
				<Badge className={cn(color, "text-[10px] px-1 py-0")} variant="outline">
					Invited
				</Badge>
			);
		case "accepted":
			return (
				<Badge className={cn(color, "text-[10px] px-1 py-0")} variant="outline">
					Accepted
				</Badge>
			);
		case "declined":
			return (
				<Badge className={cn(color, "text-[10px] px-1 py-0")} variant="outline">
					Declined
				</Badge>
			);
		case "received":
			return <Badge className={cn(color, "text-[10px] px-1 py-0")}>Received</Badge>;
	}
});
