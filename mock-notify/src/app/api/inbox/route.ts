/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import type { CoarNotifyPayload } from "~/lib/store"

import { NextResponse } from "next/server"

import { notificationStore } from "~/lib/store"

/**
 * COAR Notify inbox endpoint
 * Receives notifications from external services
 */
export async function POST(request: Request) {
	try {
		const payload = (await request.json()) as CoarNotifyPayload

		// Store the received notification
		const notification = notificationStore.addReceived(payload)

		console.log(`[Inbox] Received notification: ${payload.id}`, {
			type: payload.type,
			from: payload.origin?.id,
		})

		return NextResponse.json(
			{
				status: "accepted",
				id: notification.id,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error("[Inbox] Error processing notification:", error)
		return NextResponse.json(
			{
				status: "error",
				error: error instanceof Error ? error.message : "Invalid JSON",
			},
			{ status: 400 }
		)
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	})
}
