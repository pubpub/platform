"use client";

import { useCallback } from "react";

import type { FormsId } from "db/public";
import { Button } from "ui/button";
import { Archive, ArchiveRestore } from "ui/icon";
import { cn } from "utils";

import { useServerAction } from "~/lib/serverActions";
import { unarchiveForm } from "./actions";

type Props = {
	id: FormsId;
	className?: string;
};

export const UnarchiveFormButton = ({ id, className }: Props) => {
	const runUnarchiveForm = useServerAction(unarchiveForm);
	const handleRemove = useCallback(async () => {
		await runUnarchiveForm(id);
	}, [id]);
	return (
		<Button
			type="button"
			variant="ghost"
			size="lg"
			className={cn("flex gap-2", className)}
			onClick={handleRemove}
		>
			<ArchiveRestore size={12} /> Unarchive
		</Button>
	);
};
