import React from "react";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { cva } from "class-variance-authority";
import { AlertTriangle } from "lucide-react";

import { Info, XCircle } from "ui/icon";
import { cn } from "utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type InfoButtonProps = {
	children: React.ReactNode;
	className?: string;
	/**
	 * The type of info button to display.
	 * @defaultValue "info"
	 */
	type?: "info" | "warning" | "error";
};

const infoButtonVariants = cva("h-4 w-4 text-gray-500", {
	variants: {
		type: {
			info: "text-gray-500",
			warning: "text-yellow-500",
			error: "text-destructive",
		},
	},
});

const InfoIcon = {
	info: Info,
	warning: AlertTriangle,
	error: XCircle,
};

export const InfoButton = ({ children, className, type = "info" }: InfoButtonProps) => {
	const Icon = InfoIcon[type];
	return (
		<Tooltip>
			<TooltipTrigger type="button">
				<Icon className={cn(infoButtonVariants({ type }), className)} />
			</TooltipTrigger>
			<TooltipPortal>
				<TooltipContent className="max-w-md">{children}</TooltipContent>
			</TooltipPortal>
		</Tooltip>
	);
};
