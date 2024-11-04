"use client";

import { useCallback } from "react";

import type { FormsId } from "db/public";
import { Button } from "ui/button";
import { Archive } from "ui/icon";
import { cn } from "utils";

import { useServerAction } from "~/lib/serverActions";
import { archiveForm } from "./actions";

type Props = {
	id: FormsId;
	className?: string;
	slug: string;
};

export const ArchiveFormButton = ({ id, className, slug }: Props) => {
	const runArchiveForm = useServerAction(archiveForm);
	const handleRemove = useCallback(async () => {
		await runArchiveForm(id);
	}, [id]);
	return (
		<Button
			type="button"
			variant="ghost"
			size="lg"
			className={cn("flex gap-2", className)}
			onClick={handleRemove}
			data-testid={`${slug}-archive-button`}
		>
			<Archive size={12} /> Archive
		</Button>
	);
};
