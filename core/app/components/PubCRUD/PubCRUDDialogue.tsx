"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";
import { Pencil, Plus, Trash } from "ui/icon";
import { cn } from "utils";

import { SkeletonCard } from "../skeletons/SkeletonCard";

const CRUDMap = {
	create: {
		title: "Create Pub",
		buttonText: "Create",
		icon: Plus,
		param: `create-pub-form`,
	},
	update: {
		title: "Update Pub",
		buttonText: "Update",
		icon: Pencil,
		param: `update-pub-form`,
	},
	remove: {
		title: "Remove Pub",
		buttonText: "Remove",
		icon: Trash,
		param: `remove-pub-form`,
	},
} as const;

export type CRUDButtonProps = {
	title?: string | null;
	variant?: "secondary" | "outline" | "ghost" | "default" | "destructive";
	size?: "sm" | "default" | "lg" | "icon";
	className?: string;
};

export const PubCRUDDialogue = ({
	children,
	method,
	identifyingString,
	button,
}: {
	children: React.ReactNode;
	method: "create" | "update" | "remove";
	/**
	 * String that is necessary to identify this form from other froms,
	 * otherwise if multiple of the same button are rendered on the page
	 * multiple forms will be opened at the same time.
	 */
	identifyingString: string;
	button?: CRUDButtonProps;
}) => {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);

	const crud = CRUDMap[method];
	const queryParam = `${method}-pub-form`;

	const isOpen = urlSearchParams.get(queryParam) === identifyingString;

	const close = useCallback(
		(open: boolean) => {
			if (open) {
				urlSearchParams.set(queryParam, identifyingString);
				router.push(`${pathname}?${urlSearchParams.toString()}`);
				return;
			}

			urlSearchParams.delete(queryParam);
			router.push(`${pathname}?${urlSearchParams.toString()}`);
		},
		[pathname, router, urlSearchParams]
	);

	const [isReallyOpen, setIsReallyOpen] = React.useState(false);
	useEffect(() => {
		setIsReallyOpen(isOpen);
	}, [isOpen]);

	return (
		<Dialog onOpenChange={close} defaultOpen={false} open={isReallyOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					variant={button?.variant ?? "outline"}
					size={button?.size ?? "sm"}
					className={cn("flex items-center gap-x-2 py-4", button?.className)}
				>
					<crud.icon size="12" className="mb-0.5" />
					{button?.title === null ? null : (
						<span>{button?.title ?? crud.buttonText}</span>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				<DialogTitle>{crud.title}</DialogTitle>

				{isOpen && <Suspense fallback={<SkeletonCard />}>{children}</Suspense>}
			</DialogContent>
		</Dialog>
	);
};
