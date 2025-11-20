import type { ReactNode } from "react"

import { BookDashed, Plus } from "ui/icon"
import { cn } from "utils"

import { Button } from "./button"

export const MultiBlock = ({
	title,
	children,
	disabled,
	compact,
	onAdd,
}: {
	title: string
	children?: ReactNode
	disabled?: boolean
	compact?: boolean
	onAdd: () => void
}) => {
	return (
		<div
			className={cn(
				"flex w-full flex-col gap-4 rounded border border-dashed border-gray-300 p-1",
				{
					"bg-gray-50": disabled,
					"p-3": !compact,
				}
			)}
		>
			<div
				className={cn("flex items-center justify-between", {
					"text-muted-foreground": disabled,
				})}
			>
				<div className={cn("flex items-center gap-1", { "gap-2": !compact })}>
					<BookDashed
						size={compact ? 12 : 20}
						className={cn({ "text-emerald-500": !disabled })}
					/>
					<div className={cn("text-xs", { "text-sm": !compact })}>{title}</div>
				</div>
				<Button
					type="button"
					size={compact ? "sm" : "default"}
					variant="outline"
					disabled={disabled}
					className={cn({ "h-6 w-6 p-0": compact })}
					onClick={onAdd}
				>
					<span className="flex items-center gap-1">
						{!compact && <span>Add</span>}
						<Plus size={compact ? 10 : 16} />
					</span>
				</Button>
			</div>
			{children ? (
				<>
					<hr />
					{children}
				</>
			) : null}
		</div>
	)
}

MultiBlock.displayName = "MultiBlock"
