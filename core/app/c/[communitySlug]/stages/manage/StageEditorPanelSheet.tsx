"use client";

import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { Sheet, SheetContent } from "ui/sheet";

type Props = PropsWithChildren<{
	open: boolean;
	editingStageId?: string;
}>;

export const StageEditorPanelSheet = (props: Props) => {
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
			<SheetContent>{props.children}</SheetContent>
		</Sheet>
	);
};
