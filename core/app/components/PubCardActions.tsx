"use client";

import { Ellipsis, EllipsisVertical } from "lucide-react";

import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger,
} from "ui/drawer";
import { useIsMobile } from "ui/hooks";
import { cn } from "utils";

export const PubCardActions = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	const isMobile = useIsMobile();

	if (!isMobile) {
		return (
			<>
				<EllipsisVertical size={20} className="text-neutral-500 md:hidden" />
				<div
					className={cn(
						"hidden w-fit items-center gap-3 text-neutral-500 md:grid",
						className
					)}
				>
					{children}
				</div>
			</>
		);
	}

	return (
		<Drawer>
			<DrawerTrigger
				className={cn("flex items-center justify-center gap-2 p-2 md:hidden", className)}
			>
				<EllipsisVertical size={20} className="text-neutral-500" />
			</DrawerTrigger>
			<DrawerPortal>
				<DrawerOverlay />
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Pub Actions</DrawerTitle>
					</DrawerHeader>
					<DrawerFooter>{children}</DrawerFooter>
				</DrawerContent>
			</DrawerPortal>
		</Drawer>
	);
};
