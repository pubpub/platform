import { InstanceConfig } from "./types";

export const updatePubFields = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string
) => {
	const doi = instanceConfig.doiPrefix + "/" + pubId;
	console.log(`instanceId=${instanceId}`, `pubId=${pubId}`, doi);
	return doi;
};
