"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "ui/use-toast";

import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient";
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient";
import { useTypedPathname } from "~/lib/routing-hooks";
import { useCommunity } from "../../providers/CommunityProvider";
import { SAVE_STATUS_QUERY_PARAM } from "./constants";

export const PubEditorWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter();
	const pathname = useTypedPathname();
	const params = useSearchParams();
	const community = useCommunity();

	const onSuccess = () => {
		toast({
			title: "Success",
			description: props.isUpdating ? "Pub successfully updated" : "New pub created",
		});

		const newParams = new URLSearchParams(params);
		const currentTime = `${new Date().getTime()}`;
		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);

		if (props.isUpdating) {
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
		} else {
			const editPath = `/c/${community.slug}/pubs/${props.pub.id}/edit` as const;
			router.push(`${editPath}?${newParams.toString()}`);
		}
	};

	return (
		<PubEditorClient {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient>
	);
};
