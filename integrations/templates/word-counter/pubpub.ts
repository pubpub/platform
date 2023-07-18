import { ok as assert } from "node:assert";
import manifest from "./pubpub-manifest.json";

// @ts-expect-error
Error.prototype.toJSON = function toJSON() {
	return {
		message: this.message,
		cause: this.cause?.toString(),
	};
};

export class UpdatePubError extends Error {}

type Manifest = {
	read?: { [key: string]: { id: string } };
	write?: { [key: string]: { id: string } };
	register?: { [key: string]: { id: string } };
};

type Patch = {
	[key: string]: unknown;
};

const resolvePubFieldId = (alias: string) => {
	return (
		(manifest as Manifest).read?.[alias]?.id ??
		(manifest as Manifest).write?.[alias]?.id ??
		(manifest as Manifest).register?.[alias]?.id
	);
};

export const updatePub = async (integrationId: string, pubId: string, patch: Patch) => {
	try {
		const signal = AbortSignal.timeout(5000);
		const fields: Patch = {};
		for (const alias in patch) {
			const fieldId = resolvePubFieldId(alias);
			assert(fieldId, `Could not resolve Pub field id for alias "${alias}"`);
			fields[fieldId] = patch[alias];
		}
		const res = await fetch(
			`${process.env.PUBPUB_URL}/api/v7/integration/${integrationId}/pubs/${pubId}`,
			{
				method: "PUT",
				signal,
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
				throw new Error("Integration or pub not found");
			case 403:
				throw new Error("Invalid credentials");
		}
		throw new Error(`Unexpected response: ${res.status} ${res.statusText}`);
	} catch (error) {
		throw new UpdatePubError("Failed to update Pub", { cause: error });
	}
};
