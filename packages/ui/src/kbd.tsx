import React from "react"

import { cn } from "utils"

const KBD = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<kbd
			ref={ref}
			className={cn(
				"flex min-h-8 min-w-8 items-center justify-center rounded border-2 bg-gray-200/20 px-2",
				className
			)}
			{...props}
		/>
	)
)
KBD.displayName = "KBD"

const KeyboardShortcut = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, children, ...props }, ref) => (
		<kbd
			className={cn(
				"flex min-h-8 min-w-8 items-center justify-center font-mono font-thin tracking-[0.5em] text-gray-800",
				className
			)}
			{...props}
			ref={ref}
		>
			{children}
		</kbd>
	)
)
KeyboardShortcut.displayName = "KeyboardShortcut"

export { KBD, KeyboardShortcut }
