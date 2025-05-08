import { useEffect, useMemo, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useSSE } from "use-next-sse";

import { toast } from "ui/use-toast";

import type { ChangeNotification, NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route";

export type SSEOptions<T extends NotifyTables> = {
	url: string;
	eventName: string;
	withCredentials?: boolean;
	debounceMs?: number;
	listenTables: NotifyTables[];
	/**
	 * Can only be passed from a client component
	 */
	listenFilter?: (msg: ChangeNotification<T>) => boolean;
};

/**
 * This is a light wrapper around useSSE that debounces the data and calls the onNewData callback
 * when the data changes.
 */
export function useSSEUpdates<T extends NotifyTables>({
	url,
	eventName,
	withCredentials = true,
	debounceMs = 500,
	onNewData,
	listenTables,
	listenFilter,
}: SSEOptions<T> & {
	onNewData: (data?: ChangeNotification<T>) => void;
}) {
	const listenParams = useMemo(() => {
		const listenParams = new URLSearchParams();

		listenTables.forEach((table) => {
			listenParams.append("listen", table);
		});

		return listenParams.toString();
	}, [listenTables]);

	const urlWithParams = listenParams ? `${url}?${listenParams}` : url;

	const { data, error } = useSSE<ChangeNotification<T>>({
		url: urlWithParams,
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

		if (listenFilter && !listenFilter(debouncedData)) {
			return;
		}

		// only proceed if data has actually changed
		if (JSON.stringify(debouncedData) === JSON.stringify(lastDataRef.current)) return;

		lastDataRef.current = debouncedData;
		onNewData(debouncedData);
	}, [debouncedData, error, eventName, onNewData]);

	return { data, error };
}
