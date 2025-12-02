import type { ChangeNotification, NotifyTables } from "~/app/api/v0/c/[communitySlug]/sse/route"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
	console.log("data", data)

	const lastDataRef = useRef<ChangeNotification<T> | null>(null)
	const [debouncedData] = useDebounce(data, debounceMs)

	const [connectionBrokenToast, setConnectionBrokenToast] = useState<ReturnType<
		typeof toast
	> | null>(null)
	const [isReloading, setIsReloading] = useState(false)

	const beforeUnload = useCallback(() => {
		if (isReloading) return
		setIsReloading(true)
		window.location.reload()
	}, [isReloading])

	// we don't want to show the error toast when reloading
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
			if (isReloading) {
				return
			}

			if (connectionState === "closed") {
				logger.error({
					msg: "SSE connection closed unexpectedly",
					connectionId,
					connectionState,
					error,
				})
				// TODO: handle actual closure
				setConnectionBrokenToast(
					toast({
						variant: "default",
						title: "SSE connection closed unexpectedly",
						description: "Will try to reconnect in 5 seconds",
					})
				)
				return
			}

			logger.error({
				msg: "Unexpected error fetching SSE updates",
				connectionId,
				connectionState,
				error,
			})
			toast({
				variant: "destructive",
				title: `Error fetching ${eventName} updates`,
				description: error.message,
			})
			return
		}

		if (connectionBrokenToast) {
			connectionBrokenToast.dismiss()
			setConnectionBrokenToast(null)
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
			close()
		}
	}, [
		debouncedData,
		error,
		eventName,
		onNewData,
		connectionState,
		isReloading,
		close,
		connectionBrokenToast,
		connectionId,
		listenFilter,
	])

	return { data, error }
}
