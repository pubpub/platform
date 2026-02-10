/**
 * In-memory store for COAR Notify payloads
 * This is shared across all API routes via module singleton pattern
 */

export interface CoarNotifyPayload {
	"@context": string[]
	id: string
	type: string | string[]
	actor: {
		id: string
		type: string
		name: string
	}
	object: {
		id: string
		type: string | string[]
		[key: string]: unknown
	}
	target: {
		id: string
		type: string
		inbox?: string
	}
	origin: {
		id: string
		type: string
		inbox?: string
	}
	context?: {
		id: string
		type: string
	}
	inReplyTo?: string | null
}

export interface StoredNotification {
	id: string
	payload: CoarNotifyPayload
	direction: "received" | "sent"
	timestamp: string
	targetUrl?: string
	status?: "success" | "error"
	error?: string
}

class NotificationStore {
	private notifications: StoredNotification[] = []

	addReceived(payload: CoarNotifyPayload): StoredNotification {
		const notification: StoredNotification = {
			id: crypto.randomUUID(),
			payload,
			direction: "received",
			timestamp: new Date().toISOString(),
		}
		this.notifications.unshift(notification)
		return notification
	}

	addSent(
		payload: CoarNotifyPayload,
		targetUrl: string,
		status: "success" | "error",
		error?: string
	): StoredNotification {
		const notification: StoredNotification = {
			id: crypto.randomUUID(),
			payload,
			direction: "sent",
			timestamp: new Date().toISOString(),
			targetUrl,
			status,
			error,
		}
		this.notifications.unshift(notification)
		return notification
	}

	getAll(): StoredNotification[] {
		return this.notifications
	}

	getReceived(): StoredNotification[] {
		return this.notifications.filter((n) => n.direction === "received")
	}

	getSent(): StoredNotification[] {
		return this.notifications.filter((n) => n.direction === "sent")
	}

	clear(): void {
		this.notifications = []
	}

	delete(id: string): boolean {
		const index = this.notifications.findIndex((n) => n.id === id)
		if (index !== -1) {
			this.notifications.splice(index, 1)
			return true
		}
		return false
	}
}

// Singleton instance
export const notificationStore = new NotificationStore()
