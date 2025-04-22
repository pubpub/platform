"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import type { NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route";
import type { SSEListen } from "~/lib/notify/useSSEWithRevalidation";
import { useSSEWithRevalidation } from "~/lib/notify/useSSEWithRevalidation";
import { revalidateCurrentPath } from "./revalidateCurrentPath";

type SSERevalidatorProps<T extends NotifyTables> = {
	eventName?: string;
	debounceMs?: number;
	listen: SSEListen<T>;
};

const _SSERevalidator = <T extends NotifyTables>({
	eventName = "change",
	debounceMs = 500,
	listen,
}: SSERevalidatorProps<T>) => {
	const params = useParams<{ communitySlug: string }>();

	useSSEWithRevalidation({
		url: `/api/v0/c/${params.communitySlug}/sse`,
		eventName,
		debounceMs,
		onRevalidate: revalidateCurrentPath,
		listen,
	});

	// This component doesn't render anything
	return null;
};

/**
 * This component is used to revalidate the current path when a change is detected in the database.
 *
 * Note: if you want to pass a function, you need to import this component into another client component, as you cannot pass functions to client components from server components.
 */
export function SSERevalidator<T extends NotifyTables>({ listen }: SSERevalidatorProps<T>) {
	return (
		<Suspense>
			<_SSERevalidator listen={listen} />
		</Suspense>
	);
}
