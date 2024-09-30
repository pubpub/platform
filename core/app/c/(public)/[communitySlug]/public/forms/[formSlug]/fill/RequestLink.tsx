"use client";

import { useCallback } from "react";

import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { Mail } from "ui/icon";
import { toast } from "ui/use-toast";

import * as actions from "~/app/components/forms/actions";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { useServerAction } from "~/lib/serverActions";

export const RequestLink = ({
	formSlug,
	token,
	pubId,
}: {
	formSlug: string;
	token: string;
	pubId: PubsId;
}) => {
	const useRequestLink = useServerAction(actions.inviteUserToForm);
	const { id: communityId } = useCommunity();

	const requestLink = useCallback(async () => {
		const link = await useRequestLink({ slug: formSlug, token, pubId, communityId });

		if (link && link.error) {
			return;
		}

		toast({
			title: "Link sent",
			description: "Successfully requested new link",
		});
	}, [token, formSlug, pubId, communityId]);

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
