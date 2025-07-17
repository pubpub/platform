import { Button } from "ui/button";
import { ChevronDown, FlagTriangleRightIcon } from "ui/icon";
import { cn } from "utils";

export const BasicMoveButton = (props: {
	name: string;
	withDropdown?: boolean;
	className?: string;
}) => {
	return (
		<Button
			variant="outline"
			className={cn(
				"h-[22px] gap-0.5 rounded-full px-[.35rem] text-xs font-semibold shadow-none",
				props.withDropdown ? "" : "pr-4",
				props.className
			)}
		>
			<FlagTriangleRightIcon strokeWidth="1px" className="text-neutral-500" />
			{props.name}
			{props.withDropdown && <ChevronDown strokeWidth="1px" />}
		</Button>
	);
};
