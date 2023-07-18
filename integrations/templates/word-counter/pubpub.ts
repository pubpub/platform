import { ok as assert } from "node:assert";
import manifest from "./pubpub-manifest.json";

export class IntegrationError extends Error {
	toJSON() {
		if (this.cause) {
			return { message: this.message, cause: this.cause.toString() };
		}
		return { message: this.message };
	}
}

export class ResponseError extends IntegrationError {
	declare cause: Response;
	constructor(response: Response, message: string = "Unexpected error") {
		super(message + ` (${response.status} ${response.statusText})`, { cause: response });
	}
}

export class UpdatePubError extends IntegrationError {}

type Manifest = {
	read?: { [key: string]: { id: string } };
	write?: { [key: string]: { id: string } };
	register?: { [key: string]: { id: string } };
};

type PubPatch = {
	[key: string]: unknown;
};

const resolvePubFieldId = (alias: string) => {
	return (
		(manifest as Manifest).read?.[alias]?.id ??
		(manifest as Manifest).write?.[alias]?.id ??
		(manifest as Manifest).register?.[alias]?.id
	);
};

export const updatePub = async (integrationId: string, pubId: string, pubPatch: PubPatch) => {
	try {
		const timeoutSignal = AbortSignal.timeout(5000);
		const fields: PubPatch = {};
		for (const alias in pubPatch) {
			const fieldId = resolvePubFieldId(alias);
			assert(
				fieldId,
				`Failed to resolve alias "${alias}". Either the manifest is invalid or the alias was misspelled`
			);
			fields[fieldId] = pubPatch[alias];
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
		);
		if (res.ok) {
			return res.json();
		}
		switch (res.status) {
			case 404:
				throw new ResponseError(res, "Integration or pub not found");
			case 403:
				throw new ResponseError(res, "Invalid credentials");
		}
		throw new ResponseError(res, "PubPub service not available");
	} catch (cause) {
		throw new UpdatePubError("Failed to update Pub", { cause });
	}
};
