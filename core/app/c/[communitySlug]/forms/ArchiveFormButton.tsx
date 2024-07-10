"use client";

import { useCallback } from "react";

import { Button } from "ui/button";
import { Archive } from "ui/icon";
import { cn } from "utils";

import type { FormsId } from "~/kysely/types/public/Forms";
import { useServerAction } from "~/lib/serverActions";
import { archiveForm } from "./actions";

type Props = {
	id: FormsId;
	className: string;
};

export const ArchiveFormButton = ({ id, className }: Props) => {
	const runArchiveForm = useServerAction(archiveForm);
	const handleRemove = useCallback(async () => {
		await runArchiveForm(id);
	}, [id]);
	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn("flex gap-2", className)}
			onClick={handleRemove}
		>
			<Archive size={12} /> Archive
		</Button>
	);
};
