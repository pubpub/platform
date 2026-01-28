import { NextResponse } from "next/server"

import { notificationStore } from "~/lib/store"

/**
 * Delete a specific notification
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const deleted = notificationStore.delete(id)

	if (deleted) {
		return NextResponse.json({ status: "deleted" })
	} else {
		return NextResponse.json({ status: "not_found" }, { status: 404 })
	}
}
