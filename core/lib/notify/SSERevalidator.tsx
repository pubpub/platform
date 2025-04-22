"use client";

import { useParams } from "next/navigation";

import { useSSEWithRevalidation } from "~/lib/notify/useSSEWithRevalidation";
import { revalidateCurrentPath } from "./revalidateCurrentPath";

type SSERevalidatorProps = {
	eventName?: string;
	debounceMs?: number;
};

export function SSERevalidator({ eventName = "change", debounceMs = 500 }: SSERevalidatorProps) {
	const params = useParams<{ communitySlug: string }>();

	useSSEWithRevalidation({
		url: `/api/v0/c/${params.communitySlug}/sse`,
		eventName,
		debounceMs,
		onRevalidate: revalidateCurrentPath,
	});

	// This component doesn't render anything
	return null;
}
