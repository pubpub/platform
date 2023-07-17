import { ok as assert } from "node:assert";
import manifest from "./pubpub-manifest.json";

export class UpdatePubError extends Error {
	constructor(reason: string) {
		super(`failed to update pub field: ${reason}`);
	}
}

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
	const fields: Patch = {};
	for (const alias in patch) {
		const fieldId = resolvePubFieldId(alias);
		assert(fieldId, `could not resolve pub field id for alias "${alias}"`);
		fields[fieldId] = patch[alias];
	}
	let res: Response;
	try {
		res = await fetch(
			`${process.env.PUBPUB_URL}/api/v7/integration/${integrationId}/pubs/${pubId}`,
			{
				method: "PUT",
				signal: AbortSignal.timeout(5000),
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ fields }),
			}
		);
	} catch (error) {
		throw new UpdatePubError(`request timed out after 5 seconds`);
	}
	if (res.ok) {
		return res.json();
	}
	switch (res.status) {
		case 403:
			throw new UpdatePubError("invalid credentials");
	}
	throw new UpdatePubError(`unexpected response: ${res.status} ${res.statusText}`);
};
