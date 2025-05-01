"use client";

import { Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import type { ChangeNotification, NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route";
import { useSSEUpdates } from "~/lib/notify/useSSEUpdates";

type SSERevalidatorProps<T extends NotifyTables> = {
	eventName?: string;
	debounceMs?: number;
	listenTables: NotifyTables[];
	listenFilter?: (msg: ChangeNotification<T>) => boolean;
};

const _SSERevalidator = <T extends NotifyTables>({
	eventName = "change",
	debounceMs = 500,
	listenTables,
	listenFilter,
}: SSERevalidatorProps<T>) => {
	const params = useParams<{ communitySlug: string }>();
	const router = useRouter();

	const onNewData = useCallback(() => {
		router.refresh();
	}, [router]);

	useSSEUpdates({
		url: `/api/v0/c/${params.communitySlug}/sse`,
		eventName,
		debounceMs,
		onNewData,
		listenTables,
		listenFilter,
	});

	// This component doesn't render anything
	return null;
};

/**
 * This component is used to revalidate the current path when a change is detected in the database.
 *
 * Note: if you want to pass a function, you need to import this component into another client component, as you cannot pass functions to client components from server components.
 */
export function SSERevalidator<T extends NotifyTables>(props: SSERevalidatorProps<T>) {
	return (
		<Suspense>
			<_SSERevalidator {...props} />
		</Suspense>
	);
}
