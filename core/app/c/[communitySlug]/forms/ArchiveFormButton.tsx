"use client";

import { useCallback } from "react";

import { Button } from "ui/button";
import { Archive } from "ui/icon";

import type { FormsId } from "~/kysely/types/public/Forms";
import { useServerAction } from "~/lib/serverActions";
import { archiveForm } from "./actions";

type Props = {
	id: FormsId;
};

export const ArchiveFormButton = ({ id }: Props) => {
	const runArchiveForm = useServerAction(archiveForm);
	const handleRemove = useCallback(async () => {
		await runArchiveForm(id);
	}, [id]);
	return (
		<Button variant="ghost" size="sm" className="flex gap-2" onClick={handleRemove}>
			<Archive size={12} /> Archive
		</Button>
	);
};
