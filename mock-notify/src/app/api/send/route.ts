import { NextResponse } from "next/server"

import type { CoarNotifyPayload } from "~/lib/store"
import { notificationStore } from "~/lib/store"

interface SendRequest {
	targetUrl: string
	payload: CoarNotifyPayload
}

/**
 * Send a COAR Notify payload to an external inbox
 */
export async function POST(request: Request) {
	try {
		const { targetUrl, payload } = (await request.json()) as SendRequest

		if (!targetUrl || !payload) {
			return NextResponse.json(
				{ status: "error", error: "Missing targetUrl or payload" },
				{ status: 400 }
			)
		}

		console.log(`[Send] Sending notification to: ${targetUrl}`, {
			type: payload.type,
			id: payload.id,
		})

		const response = await fetch(targetUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/ld+json",
			},
			body: JSON.stringify(payload),
		})

		if (response.ok) {
			const notification = notificationStore.addSent(payload, targetUrl, "success")
			console.log(`[Send] Successfully sent notification: ${payload.id}`)
			return NextResponse.json({
				status: "sent",
				id: notification.id,
				response: {
					status: response.status,
					statusText: response.statusText,
				},
			})
		} else {
			const errorText = await response.text()
			const notification = notificationStore.addSent(
				payload,
				targetUrl,
				"error",
				`${response.status}: ${errorText}`
			)
			console.error(`[Send] Failed to send notification: ${response.status}`, errorText)
			return NextResponse.json(
				{
					status: "error",
					id: notification.id,
					error: `Failed to send: ${response.status} ${response.statusText}`,
				},
				{ status: 502 }
			)
		}
	} catch (error) {
		console.error("[Send] Error sending notification:", error)

		// Still store the failed attempt if we have the payload
		let notificationId: string | undefined
		try {
			const body = await request.clone().json()
			if (body.payload && body.targetUrl) {
				const notification = notificationStore.addSent(
					body.payload,
					body.targetUrl,
					"error",
					error instanceof Error ? error.message : "Unknown error"
				)
				notificationId = notification.id
			}
		} catch {
			// Ignore parsing errors
		}

		return NextResponse.json(
			{
				status: "error",
				id: notificationId,
				error: error instanceof Error ? error.message : "Failed to send notification",
			},
			{ status: 500 }
		)
	}
}
