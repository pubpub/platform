"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sheet, SheetContent } from "ui/sheet";

type Props = PropsWithChildren<{
	open: boolean;
}>;

export const StagePanelSheet = (props: Props) => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
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
			<SheetContent className="max-h-100vh overflow-y-auto">{props.children}</SheetContent>
		</Sheet>
	);
};
