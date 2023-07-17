import { InstanceConfig } from "./config";

export class CreateDoiError extends Error {
	constructor(reason: string) {
		super(`failed to create DOI: ${reason}`);
	}
}

const encodeCredentials = (accountId: string, password: string) =>
	Buffer.from(`${accountId}:${password}`).toString("base64");

export const createDoi = async (instanceConfig: InstanceConfig) => {
	const req = await fetch(`https://api.test.datacite.org/dois`, {
		method: "POST",
		headers: {
			"Content-Type": "application/vnd.api+json",
			Authorization: `Basic ${encodeCredentials(
				instanceConfig.accountId,
				instanceConfig.password
			)}`,
		},
		body: JSON.stringify({
			data: {
				type: "dois",
				attributes: {
					prefix: instanceConfig.doiPrefix,
				},
			},
		}),
	});
	if (req.ok) {
		const res = await req.json();
		return res.data.attributes.doi;
	}
	if (req.status === 404) {
		throw new CreateDoiError("invalid credentials or DOI prefix");
	}
};
