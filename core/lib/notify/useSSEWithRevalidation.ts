import { useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useSSE } from "use-next-sse";

import { toast } from "ui/use-toast";

export type SSEOptions = {
	url: string;
	eventName: string;
	withCredentials?: boolean;
	debounceMs?: number;
};

export function useSSEWithRevalidation<T>({
	url,
	eventName,
	withCredentials = true,
	debounceMs = 500,
	onRevalidate,
}: SSEOptions & {
	onRevalidate: () => void;
}) {
	const { data, error } = useSSE<T>({
		url,
		eventName,
		withCredentials,
	});

	const lastDataRef = useRef<T | null>(null);
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

		// only proceed if data has actually changed
		if (JSON.stringify(debouncedData) === JSON.stringify(lastDataRef.current)) return;

		lastDataRef.current = debouncedData;
		onRevalidate();
	}, [debouncedData, error, eventName, onRevalidate]);

	return { data, error };
}
