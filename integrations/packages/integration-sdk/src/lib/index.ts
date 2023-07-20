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

export class PubPubError extends IntegrationError {}

export type Manifest = {
	read?: { [key: string]: { id: string } }
	write?: { [key: string]: { id: string } }
	register?: { [key: string]: { id: string } }
}

export type PubPatch = {
	[key: string]: unknown
}

export const getPub = async (integrationId: string, pubId: string) => {
	const signal = AbortSignal.timeout(5000)
	try {
		const response = await fetch(
			`${process.env.PUBPUB_URL}/api/v7/integrations/${integrationId}/pubs/${pubId}`,
			{
				method: "GET",
				signal,
				headers: { "Content-Type": "application/json" },
			}
		)
		if (response.ok) {
			return response.json()
		}
		switch (response.status) {
			case 404:
				throw new ResponseError(response, "Integration or Pub not found")
			case 403:
				throw new ResponseError(response, "Failed to authorize integration")
		}
		throw new ResponseError(response, "Failed to connect to PubPub")
	} catch (cause) {
		throw new PubPubError("Failed to get Pub", { cause })
	}
}

export const updatePub = async (
	integrationId: string,
	pubId: string,
	pubPatch: PubPatch
) => {
	try {
		const signal = AbortSignal.timeout(5000)
		const response = await fetch(
			`${process.env.PUBPUB_URL}/api/v7/integrations/${integrationId}/pubs/${pubId}`,
			{
				method: "PUT",
				signal,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fields: pubPatch }),
			}
		)
		if (response.ok) {
			return response.json()
		}
		switch (response.status) {
			case 404:
				throw new ResponseError(response, "Integration or Pub not found")
			case 403:
				throw new ResponseError(response, "Failed to authorize integration")
		}
		throw new ResponseError(response, "Failed to connect to PubPub")
	} catch (cause) {
		throw new PubPubError("Failed to update Pub", { cause })
	}
}

type GetResponse<T extends string[]> = {
	[K in T[number]]: unknown
}

type PutResponse<T extends string[]> = {
	[K in T[number]]: unknown
}

type Patch<T extends string[]> = {
	[K in T[number]]: unknown
}

export type Client<T extends Manifest> = {
	get<
		U extends (
			| Extract<keyof T["write"], string>
			| Extract<keyof T["read"], string>
		)[]
	>(
		instanceId: string,
		pubId: string,
		...fields: U
	): Promise<GetResponse<U>>
	put<U extends Extract<keyof T["write"], string>[]>(
		instanceId: string,
		pubId: string,
		patch: Patch<U>
	): Promise<PutResponse<U>>
}

export const make = <T extends Manifest>(manifest: T): Client<T> => {
	return {
		get: async (instanceId, pubId, ...fields) => {
			const signal = AbortSignal.timeout(5000)
			try {
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/v7/integrations/${instanceId}/pubs/${pubId}`,
					{
						method: "GET",
						signal,
						headers: { "Content-Type": "application/json" },
					}
				)
				if (response.ok) {
					return response.json()
				}
				switch (response.status) {
					case 404:
						throw new ResponseError(response, "Integration or Pub not found")
					case 403:
						throw new ResponseError(response, "Failed to authorize integration")
				}
				throw new ResponseError(response, "Failed to connect to PubPub")
			} catch (cause) {
				throw new PubPubError("Failed to get Pub", { cause })
			}
		},
		put: async (instanceId, pubId, patch) => {
			try {
				const signal = AbortSignal.timeout(5000)
				const response = await fetch(
					`${process.env.PUBPUB_URL}/api/v7/integrations/${instanceId}/pubs/${pubId}`,
					{
						method: "PUT",
						signal,
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ fields: patch }),
					}
				)
				if (response.ok) {
					return response.json()
				}
				switch (response.status) {
					case 404:
						throw new ResponseError(response, "Integration or Pub not found")
					case 403:
						throw new ResponseError(response, "Failed to authorize integration")
				}
				throw new ResponseError(response, "Failed to connect to PubPub")
			} catch (cause) {
				throw new PubPubError("Failed to update Pub", { cause })
			}
		},
	}
}
