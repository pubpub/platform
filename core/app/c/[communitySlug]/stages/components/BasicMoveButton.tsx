import { ChevronDown, FlagTriangleRightIcon } from "ui/icon"
import { cn } from "utils"

interface Props extends React.ComponentPropsWithoutRef<"button"> {
	name: string
	withDropdown?: boolean
	ref?: React.RefObject<HTMLButtonElement>
}

export const BasicMoveButton = ({ name, withDropdown, className, ...props }: Props) => {
	return (
		<button
			{...props}
			className={cn(
				"flex h-5! items-center gap-0.5 rounded-full border bg-background px-2 font-normal text-xs shadow-none",
				withDropdown ? "" : "pr-4",
				className
			)}
		>
			<FlagTriangleRightIcon strokeWidth="1px" className="size-3 text-neutral-500" size={8} />

			{name}
			{withDropdown && <ChevronDown strokeWidth="1px" className="size-3.5" size={8} />}
		</button>
	)
}
