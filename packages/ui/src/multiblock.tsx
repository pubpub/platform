import type { ReactNode } from "react";

import React from "react";

import { BookDashed, Plus } from "ui/icon";
import { cn } from "utils";

import { Button } from "./button";

// TODO (#791): support a form array field
export const MultiBlock = ({
	title,
	children,
	disabled,
}: {
	title: string;
	children?: ReactNode;
	disabled?: boolean;
}) => {
	return (
		<div
			className={cn("w-full rounded border border-dashed border-gray-300 p-1", {
				"bg-gray-50": disabled,
			})}
		>
			<div
				className={cn("flex items-center justify-between", {
					"text-muted-foreground": disabled,
				})}
			>
				<div className="flex items-center gap-1">
					<BookDashed size={12} />
					<div className="text-xs">{title}</div>
				</div>
				<Button size="sm" variant="outline" disabled={disabled} className="h-6 w-6 p-0">
					<Plus size={10} />
				</Button>
			</div>
			{children}
		</div>
	);
};

MultiBlock.displayName = "MultiBlock";
