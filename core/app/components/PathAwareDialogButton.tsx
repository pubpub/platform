"use client";

import { Button } from "ui/button";
import { Loader2 } from "ui/icon";
import { cn } from "utils";

import { usePathAwareDialogSearchParam } from "~/lib/client/usePathAwareDialogSearchParam";

export type PathAwareDialogueProps = {
	variant?: "secondary" | "outline" | "ghost" | "default" | "destructive";
	size?: "sm" | "default" | "lg" | "icon";
	className?: string;
	children?: React.ReactNode;
	id: string;
};

export const PathAwareDialogButton = (props: PathAwareDialogueProps) => {
	const { isPending, toggleDialog: toggleDialogue } = usePathAwareDialogSearchParam({
		id: props.id,
	});
	// Should maybe be a link, but then it plays less nicely with `nuqs`
	return (
		<Button
			onClick={() => toggleDialogue(true)}
			variant={props?.variant ?? "outline"}
			size={props?.size ?? "sm"}
			className={cn("flex items-center gap-x-2 py-4", props?.className)}
		>
			{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{props.children}</>}
		</Button>
	);
};
