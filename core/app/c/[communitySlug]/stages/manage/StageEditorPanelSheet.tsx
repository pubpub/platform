"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { Sheet, SheetContent } from "ui/sheet";

type Props = PropsWithChildren<{
	open: boolean;
	onOpenChange(open: boolean): void;
}>;

export const StageEditorPanelSheet = (props: Props) => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(props.open);
	}, [props.open]);

	return (
		<Sheet open={open} onOpenChange={props.onOpenChange}>
			<SheetContent>{props.children}</SheetContent>
		</Sheet>
	);
};
