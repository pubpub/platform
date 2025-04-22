import { useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useSSE } from "use-next-sse";

import { toast } from "ui/use-toast";

import type { ChangeNotification, NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route";

export type SSEListen<T extends NotifyTables> =
	| NotifyTables[]
	| ((msg: ChangeNotification<T>) => boolean);

export type SSEOptions<T extends NotifyTables> = {
	url: string;
	eventName: string;
	withCredentials?: boolean;
	debounceMs?: number;
	listen: SSEListen<T>;
};

export function useSSEWithRevalidation<T extends NotifyTables>({
	url,
	eventName,
	withCredentials = true,
	debounceMs = 500,
	onRevalidate,
	listen,
}: SSEOptions<T> & {
	onRevalidate: () => void;
}) {
	const { data, error } = useSSE<ChangeNotification<T>>({
		url,
		eventName,
		withCredentials,
		reconnect: true,
	});

	const lastDataRef = useRef<ChangeNotification<T> | null>(null);
	const [debouncedData] = useDebounce(data, debounceMs);

	useEffect(() => {
		if (error) {
			toast({
				variant: "destructive",
				title: `Error fetching ${eventName} updates`,
				description: error.message,
			});
			return;
		}

		if (!debouncedData) return;

		if (Array.isArray(listen) && !listen.includes(debouncedData.table)) {
			return;
		}

		if (typeof listen === "function" && !listen(debouncedData)) {
			return;
		}

		// only proceed if data has actually changed
		if (JSON.stringify(debouncedData) === JSON.stringify(lastDataRef.current)) return;

		lastDataRef.current = debouncedData;
		onRevalidate();
	}, [debouncedData, error, eventName, onRevalidate]);

	return { data, error };
}
