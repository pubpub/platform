import { InstanceConfig } from "./config";

export class CreateDoiFailureError extends Error {
	constructor(reason: string) {
		super(`failed to create DOI: ${reason}`);
	}
}

const encodeCredentials = (accountId: string, password: string) =>
	Buffer.from(`${accountId}:${password}`).toString("base64");

const createDoi = async (instanceConfig: InstanceConfig) => {
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
	console.log(await req.text());
	if (req.status === 404) {
		throw new CreateDoiFailureError("invalid credentials or DOI prefix");
	}
};

export const updatePubFields = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string
) => {
	const doi = await createDoi(instanceConfig);
	console.log(`instanceId=${instanceId}`, `pubId=${pubId}`, doi);
	return doi;
};
