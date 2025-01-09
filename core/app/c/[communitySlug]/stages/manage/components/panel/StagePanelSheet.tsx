"use client";

import type { PropsWithChildren } from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Sheet, SheetContent } from "ui/sheet";

import { useTypedPathname } from "~/lib/routing-hooks";

type Props = PropsWithChildren<{
	open: boolean;
}>;

export const StagePanelSheet = (props: Props) => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = useTypedPathname();
	const onOpenChange = (open: boolean) => {
		if (!open) {
			router.push(pathname!);
		}
	};

	useEffect(() => {
		setOpen(props.open);
	}, [props.open]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="max-h-100vh overflow-y-auto sm:max-w-md">
				{props.children}
			</SheetContent>
		</Sheet>
	);
};
