import type { ButtonProps } from "./button"

import * as React from "react"

import { cn } from "utils"

import { Button } from "./button"
import { Check, Clipboard } from "./icon"

export interface CopyButtonProps extends ButtonProps {
	value: string
	src?: string
}

export async function copyToClipboardWithMeta(value: string) {
	navigator.clipboard.writeText(value)
}

export function CopyButton({
	value,
	className,
	src,
	variant = "ghost",
	children,
	...props
}: CopyButtonProps) {
	const [hasCopied, setHasCopied] = React.useState(false)

	React.useEffect(() => {
		setTimeout(() => {
			setHasCopied(false)
		}, 2000)
	}, [])

	return (
		<Button
			size="icon"
			variant={variant}
			className={cn("relative z-10 h-6 w-6 [&_svg]:size-3", className)}
			onClick={() => {
				void copyToClipboardWithMeta(value)
				setHasCopied(true)
			}}
			{...props}
		>
			<span className="sr-only">Copy</span>
			{children}
			{hasCopied ? <Check /> : <Clipboard />}
		</Button>
	)
}
