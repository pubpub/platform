import { InstanceConfig } from "./config";
import { ResponseError, IntegrationError } from "./pubpub";

export class DataciteError extends IntegrationError {}

const encodeCredentials = (accountId: string, password: string) =>
	Buffer.from(`${accountId}:${password}`).toString("base64");

const makeDataciteHeaders = (instanceConfig: InstanceConfig) => ({
	"Content-Type": "application/vnd.api+json",
	Authorization: `Basic ${encodeCredentials(instanceConfig.accountId, instanceConfig.password)}`,
});

const fetchDatacite = async (path: string, options: RequestInit) => {
	const res = await fetch(`${process.env.DATACITE_URL}/${path}`, options);
	if (res.ok) {
		return res;
	}
	if (
		res.status === 404 || // DataCite returns a 404 if credentials are invalid
		res.status === 403 || // DataCite doesn't return a 403, but we should handle it anyway
		res.status === 500 // DataCite returns a 500 if credentials are malformatted
	) {
		throw new ResponseError(res, "Invalid DataCite credentials or DOI prefix");
	}
	throw new ResponseError(res, `Could not connect to DataCite (${res.status} ${res.statusText})`);
};

export const createDoi = async (instanceConfig: InstanceConfig) => {
	try {
		const res = await fetchDatacite("dois", {
			method: "POST",
			headers: makeDataciteHeaders(instanceConfig),
			body: JSON.stringify({
				data: {
					type: "dois",
					attributes: {
						prefix: instanceConfig.doiPrefix,
					},
				},
			}),
		});
		return (await res.json()).data.id;
	} catch (cause) {
		throw new DataciteError("Failed to create DOI", { cause });
	}
};

export const deleteDoi = async (instanceConfig: InstanceConfig, doi: string) => {
	try {
		await fetchDatacite(`dois/${doi}`, {
			method: "DELETE",
			headers: makeDataciteHeaders(instanceConfig),
		});
	} catch (cause) {
		throw new DataciteError("Failed to delete DOI", { cause });
	}
};
