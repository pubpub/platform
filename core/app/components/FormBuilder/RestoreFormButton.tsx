"use client";

import { useCallback } from "react";

import type { FormsId } from "db/public";
import { Button } from "ui/button";
import { ArchiveRestore } from "ui/icon";
import { cn } from "utils";

import { useServerAction } from "~/lib/serverActions";
import { restoreForm } from "./actions";

type Props = {
	id: FormsId;
	className?: string;
};

export const RestoreFormButton = ({ id, className }: Props) => {
	const runRestoreForm = useServerAction(restoreForm);
	const handleRemove = useCallback(async () => {
		await runRestoreForm(id);
	}, [id]);
	return (
		<Button
			type="button"
			variant="ghost"
			size="lg"
			className={cn("flex gap-2", className)}
			onClick={handleRemove}
		>
			<ArchiveRestore size={12} /> Restore
		</Button>
	);
};
