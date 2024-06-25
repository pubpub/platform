import * as React from "react";

import { cn } from "utils";

import type { ButtonProps } from "./button";
import { Button } from "./button";
import { Check, Clipboard } from "./icon";

interface CopyButtonProps extends ButtonProps {
	value: string;
	src?: string;
}

export async function copyToClipboardWithMeta(value: string) {
	navigator.clipboard.writeText(value);
}

export function CopyButton({
	value,
	className,
	src,
	variant = "ghost",
	...props
}: CopyButtonProps) {
	const [hasCopied, setHasCopied] = React.useState(false);

	React.useEffect(() => {
		setTimeout(() => {
			setHasCopied(false);
		}, 2000);
	}, [hasCopied]);

	return (
		<Button
			size="icon"
			variant={variant}
			className={cn("[&_svg]:size-3 relative z-10 h-6 w-6", className)}
			onClick={() => {
				copyToClipboardWithMeta(value);
				setHasCopied(true);
			}}
			{...props}
		>
			<span className="sr-only">Copy</span>
			{hasCopied ? <Check /> : <Clipboard />}
		</Button>
	);
}
