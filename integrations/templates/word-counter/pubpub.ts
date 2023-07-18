import { ok as assert } from "node:assert"
import manifest from "./public/pubpub-manifest.json"

const StatusText = {
	100: "Continue",
	101: "Switching Protocols",
	200: "OK",
	201: "Created",
	202: "Accepted",
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	408: "Request Timeout",
	409: "Conflict",
	500: "Internal Server Error",
	501: "Not Implemented",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Time-out",
}

export class IntegrationError extends Error {
	toJSON() {
		if (this.cause) {
			return { message: this.message, cause: this.cause.toString() }
		}
		return { message: this.message }
	}
}

export class ResponseError extends IntegrationError {
	declare cause: Response

	constructor(
		cause: Response | keyof typeof StatusText,
		message: string = "Unexpected error"
	) {
		if (typeof cause === "number") {
			cause = new Response(null, {
				status: cause,
				statusText: StatusText[cause],
			})
		}
		super(`${message}`, { cause })
	}

	toJSON() {
		return {
			message: this.message,
			cause: `The server responded with ${this.cause.status} (${this.cause.statusText})`,
		}
	}
}

export class UpdatePubError extends IntegrationError {}

export type Manifest = {
	read?: { [key: string]: { id: string } }
	write?: { [key: string]: { id: string } }
	register?: { [key: string]: { id: string } }
}

export type PubPatch = {
	[key: string]: unknown
}

const resolvePubFieldId = (alias: string) => {
	return (
		(manifest as Manifest).read?.[alias]?.id ??
		(manifest as Manifest).write?.[alias]?.id ??
		(manifest as Manifest).register?.[alias]?.id
	)
}

export const updatePub = async (
	integrationId: string,
	pubId: string,
	pubPatch: PubPatch
) => {
	try {
		const timeoutSignal = AbortSignal.timeout(5000)
		const fields: PubPatch = {}
		for (const alias in pubPatch) {
			const fieldId = resolvePubFieldId(alias)
			assert(
				fieldId,
				`Failed to resolve alias "${alias}". Either the manifest is invalid or the alias was misspelled`
			)
			fields[fieldId] = pubPatch[alias]
		}
		const res = await fetch(
			`${process.env.PUBPUB_URL}/api/v7/integration/${integrationId}/pubs/${pubId}`,
			{
				method: "PUT",
				signal: timeoutSignal,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ fields }),
			}
		)
		if (res.ok) {
			return res.json()
		}
		switch (res.status) {
			case 404:
				throw new ResponseError(res, "Integration or Pub not found")
			case 403:
				throw new ResponseError(res, "Failed to authorize integration")
		}
		throw new ResponseError(res, "Failed to connect to PubPub")
	} catch (cause) {
		throw new UpdatePubError("Failed to update Pub", { cause })
	}
}
