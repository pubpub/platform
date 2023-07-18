import { InstanceConfig } from "./config";

export class CreateDoiError extends Error {}
export class DeleteDoiError extends Error {}

const encodeCredentials = (accountId: string, password: string) =>
	Buffer.from(`${accountId}:${password}`).toString("base64");

export const createDoi = async (instanceConfig: InstanceConfig) => {
	try {
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
			throw new Error("invalid credentials or DOI prefix");
		}
	} catch (cause) {
		throw new CreateDoiError("Failed to create DOI", { cause });
	}
};

export const deleteDoi = async (instanceConfig: InstanceConfig, doi: string) => {
	try {
		const req = await fetch(`https://api.test.datacite.org/dois/${doi}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/vnd.api+json",
				Authorization: `Basic ${encodeCredentials(
					instanceConfig.accountId,
					instanceConfig.password
				)}`,
			},
		});
		if (req.status === 404) {
			throw new Error("Invalid credentials or DOI prefix");
		}
	} catch (cause) {
		throw new DeleteDoiError("Failed to delete DOI", { cause });
	}
};
