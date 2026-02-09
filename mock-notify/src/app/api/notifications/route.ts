import { NextResponse } from "next/server"

import { notificationStore, type StoredNotification } from "~/lib/store"

/**
 * Get all stored notifications
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const direction = searchParams.get("direction")

	let notifications: StoredNotification[]
	if (direction === "received") {
		notifications = notificationStore.getReceived()
	} else if (direction === "sent") {
		notifications = notificationStore.getSent()
	} else {
		notifications = notificationStore.getAll()
	}

	return NextResponse.json({ notifications })
}

/**
 * Clear all notifications
 */
export async function DELETE() {
	notificationStore.clear()
	return NextResponse.json({ status: "cleared" })
}
