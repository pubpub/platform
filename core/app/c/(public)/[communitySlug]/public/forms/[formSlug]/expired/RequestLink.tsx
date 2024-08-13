"use client";

import { useCallback } from "react";

import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { Mail } from "ui/icon";
import { toast } from "ui/use-toast";

import { useServerAction } from "~/lib/serverActions";
import * as actions from "../actions";

export const RequestLink = ({
	formSlug,
	communitySlug,
	email,
	pubId,
}: {
	formSlug: string;
	communitySlug: string;
	email: string;
	pubId: PubsId;
}) => {
	const useRequestLink = useServerAction(actions.inviteUserToForm);

	const requestLink = useCallback(async () => {
		const link = await useRequestLink({ slug: formSlug, email, pubId });

		if (link && link.error) {
			return;
		}

		toast({
			title: "Link sent",
			description: "Successfully requested new link",
		});
	}, [email, formSlug, communitySlug, pubId]);

	return (
		<Button
			variant="secondary"
			className="bg-blue-500 text-slate-50 shadow-sm hover:bg-blue-500/90 dark:bg-blue-900 dark:text-slate-50 dark:hover:bg-blue-900/90"
			onClick={requestLink}
		>
			<Mail size={16} className="mr-1" strokeWidth={1} /> Request New Link
		</Button>
	);
};
