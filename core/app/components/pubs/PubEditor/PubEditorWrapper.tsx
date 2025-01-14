"use client";

import type { FieldValues } from "react-hook-form";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "ui/use-toast";

import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient";
import { PubEditorClient } from "~/app/components/pubs/PubEditor/PubEditorClient";
import { pubEditPath } from "~/lib/paths";
import { useCommunity } from "../../providers/CommunityProvider";
import { SAVE_STATUS_QUERY_PARAM } from "./constants";

export const PubEditorWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const community = useCommunity();

	const onSuccess = (args: {
		values: FieldValues;
		submitButtonId?: string;
		isAutoSave: boolean;
		slug?: string;
	}) => {
		toast({
			title: "Success",
			description: props.isUpdating ? "Pub successfully updated" : "New pub created",
		});

		const newParams = new URLSearchParams(searchParams);
		const currentTime = `${new Date().getTime()}`;
		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);

		if (props.isUpdating) {
			const editPath = pubEditPath(community.slug, args.slug ?? props.pub.slug);

			router.replace(`${editPath}?${newParams.toString()}`, { scroll: false });
		} else {
			const editPath = pubEditPath(community.slug, args.slug ?? props.pub.slug);
			router.push(`${editPath}?${newParams.toString()}`);
		}
	};

	return (
		<PubEditorClient {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient>
	);
};
