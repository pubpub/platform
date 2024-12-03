"use client";

import type { FieldValues } from "react-hook-form";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "ui/use-toast";

import type { PubEditorClientProps } from "~/app/components/pubs/PubEditor/PubEditorClient2";
import { SAVE_STATUS_QUERY_PARAM } from "~/app/c/(public)/[communitySlug]/public/forms/[formSlug]/fill/constants";
import { PubEditorClient2 } from "~/app/components/pubs/PubEditor/PubEditorClient2";

export const PubEditorWrapper = ({
	children,
	...props
}: Omit<PubEditorClientProps, "onSuccess">) => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const onSuccess = () => {
		toast({
			title: "Success",
			description: props.isUpdating ? "Pub successfully updated" : "New pub created",
		});

		const newParams = new URLSearchParams(params);
		const currentTime = `${new Date().getTime()}`;

		newParams.set(SAVE_STATUS_QUERY_PARAM, currentTime);
		router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
	};

	return (
		<PubEditorClient2 {...props} onSuccess={onSuccess}>
			{children}
		</PubEditorClient2>
	);
};
