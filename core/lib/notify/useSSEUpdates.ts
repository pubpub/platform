import type { ChangeNotification, NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useDebounce } from "use-debounce"
import { useSSE } from "use-next-sse"

import { logger } from "logger"
import { toast } from "ui/use-toast"

export type SSEOptions<T extends NotifyTables> = {
	url: string
	eventName: string
	withCredentials?: boolean
	debounceMs?: number
	listenTables: NotifyTables[]
	/**
	 * Can only be passed from a client component
	 */
	listenFilter?: (msg: ChangeNotification<T>) => boolean
}

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
	onNewData: (data?: ChangeNotification<T>) => void
}) {
	const connectionId = useMemo(() => crypto.randomUUID(), [])

	const listenParams = useMemo(() => {
		const listenParams = new URLSearchParams()

		listenTables.forEach((table) => {
			listenParams.append("listen", table)
		})

		listenParams.append("connectionId", connectionId)

		return listenParams.toString()
	}, [listenTables, connectionId])

	const urlWithParams = listenParams ? `${url}?${listenParams}` : url

	const { data, error, close, connectionState } = useSSE<ChangeNotification<T>>({
		url: urlWithParams,
		eventName,
		withCredentials,
		reconnect: true,
	})

	const lastDataRef = useRef<ChangeNotification<T> | null>(null)
	const connectionStateRef = useRef<"connecting" | "open" | "closed" | null>(null)
	connectionStateRef.current = connectionState

	const [debouncedData] = useDebounce(data, debounceMs)

	const connectionBrokenToastRef = useRef<ReturnType<typeof toast> | null>(null)
	const isReloadingRef = useRef(false)

	const beforeUnload = useCallback(() => {
		if (isReloadingRef.current) return
		isReloadingRef.current = true
		window.location.reload()
	}, [])

	// we don't want to show the error toast when user
	// refreshes the page/navigates away
	useEffect(() => {
		window.addEventListener("beforeunload", beforeUnload)

		return () => {
			window.removeEventListener("beforeunload", beforeUnload)
		}
	}, [beforeUnload])

	useEffect(() => {
		if (error) {
			// it shows an error when reloading (it lost the connection)
			// but we don't want to show that error obvs
			if (isReloadingRef.current) {
				return
			}

			if (connectionStateRef.current === "closed") {
				logger.error({
					msg: "SSE connection closed unexpectedly",
					connectionId,
					connectionState: connectionStateRef.current,
					error,
				})
				// TODO: handle actual closure
				connectionBrokenToastRef.current = toast({
					variant: "default",
					title: "SSE connection closed unexpectedly",
					description: "Will try to reconnect in 5 seconds",
				})
				return
			}

			logger.error({
				msg: "Unexpected error fetching SSE updates",
				connectionId,
				connectionState: connectionStateRef.current,
				error,
			})
			toast({
				variant: "destructive",
				title: `Error fetching ${eventName} updates`,
				description: error.message,
			})
			return
		}

		if (connectionBrokenToastRef.current) {
			connectionBrokenToastRef.current.dismiss()
			connectionBrokenToastRef.current = null
		}

		if (!debouncedData) return

		if (listenFilter && !listenFilter(debouncedData)) {
			return
		}

		// only proceed if data has actually changed
		if (JSON.stringify(debouncedData) === JSON.stringify(lastDataRef.current)) return

		lastDataRef.current = debouncedData
		onNewData(debouncedData)

		return () => {
			lastDataRef.current = null
			if (connectionStateRef.current !== "closed") {
				close()
			}
		}
	}, [
		debouncedData,
		// if we use error we get infinite re-renders
		error?.message,
		eventName,
		connectionId,
		listenFilter,
		// we don't include close bc it's not properly memoized by useSSE
	])

	return { data, error }
}
