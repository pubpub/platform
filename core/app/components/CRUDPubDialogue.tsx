"use client";

import React, { Suspense, use, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";
import { Pencil, Plus, Trash } from "ui/icon";

import { SkeletonCard } from "./skeletons/SkeletonCard";

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

export const CRUDPubDialogue = ({
	children,
	method,
}: {
	children: React.ReactNode;
	method: "create" | "update" | "remove";
}) => {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);

	const crud = CRUDMap[method];
	const queryParam = `${method}-pub-form`;

	const isOpen = Boolean(urlSearchParams.get(queryParam));

	const close = useCallback(
		(open: boolean) => {
			if (open) {
				urlSearchParams.set(queryParam, "true");
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
		<Dialog onOpenChange={close} open={isReallyOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					variant={"outline"}
					size={"sm"}
					className={"flex items-center gap-x-2 py-4"}
				>
					<crud.icon size="12" className="mb-0.5" />
					<span>{crud.buttonText}</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>{crud.title}</DialogTitle>

				{isOpen && <Suspense fallback={<SkeletonCard />}>{children}</Suspense>}
			</DialogContent>
		</Dialog>
	);
};
