"use client"

import type { VariantProps } from "class-variance-authority"

import * as React from "react"
import { useState } from "react"
import { cva } from "class-variance-authority"

import { cn } from "utils"

import { Button } from "./button"
import { ChevronDown, ChevronUp } from "./icon"

const showMoreVariants = cva("relative overflow-hidden", {
	variants: {
		variant: {
			default: "max-h-[200px]",
			sm: "max-h-[100px]",
			lg: "max-h-[300px]",
			xl: "max-h-[400px]",
		},
	},
	defaultVariants: {
		variant: "default",
	},
})

export interface ShowMoreProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof showMoreVariants> {
	children: React.ReactNode
	showMoreText?: string
	showLessText?: string
	animate?: boolean
}

export function ShowMore({
	children,
	className,
	variant,
	showMoreText = "Show more",
	showLessText = "Show less",
	animate = true,
	...props
}: ShowMoreProps) {
	const [expanded, setExpanded] = useState(false)

	const toggleExpanded = () => setExpanded((prev) => !prev)

	const ref = React.useRef<HTMLDivElement>(null)

	const [fitsInContainer, setFitsInContainer] = useState(false)

	React.useEffect(() => {
		if (
			!fitsInContainer &&
			ref.current?.clientHeight &&
			ref.current?.clientHeight < (variant === "default" ? 200 : variant === "sm" ? 100 : 400)
		) {
			setFitsInContainer(true)
		}
	}, [ref.current])

	return (
		<div className={cn("w-fit", className)} {...props}>
			<div
				className={cn(
					showMoreVariants({ variant }),
					expanded && "max-h-full",
					animate && "transition-[max-height] duration-300 ease-in-out",
					!expanded &&
						!fitsInContainer &&
						"after:absolute after:bottom-0 after:left-0 after:h-16 after:w-full after:bg-linear-to-t after:from-background after:to-transparent"
				)}
			>
				<div ref={ref}>{children}</div>
			</div>
			{(!fitsInContainer || expanded) && (
				<div className="mt-2 flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleExpanded}
						className="flex items-center gap-1"
					>
						{expanded ? (
							<>
								{showLessText}
								<ChevronUp size={16} />
							</>
						) : (
							<>
								{showMoreText}
								<ChevronDown size={16} />
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	)
}
