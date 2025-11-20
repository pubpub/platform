import { Button } from "ui/button"
import { ChevronDown, FlagTriangleRightIcon } from "ui/icon"
import { cn } from "utils"

interface Props extends React.ComponentPropsWithoutRef<"button"> {
	name: string
	withDropdown?: boolean
	ref?: React.RefObject<HTMLButtonElement>
}

export const BasicMoveButton = ({ name, withDropdown, className, ...props }: Props) => {
	return (
		<Button
			variant="outline"
			{...props}
			className={cn(
				"h-[22px] gap-0.5 rounded-full px-[.35rem] font-semibold text-xs shadow-none",
				withDropdown ? "" : "pr-4",
				className
			)}
		>
			<FlagTriangleRightIcon strokeWidth="1px" className="text-neutral-500" />
			{name}
			{withDropdown && <ChevronDown strokeWidth="1px" />}
		</Button>
	)
}
