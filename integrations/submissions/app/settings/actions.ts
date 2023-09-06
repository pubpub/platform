import { updateInstance } from "~/lib/instance";

export const configure = async (instanceId: string, pubTypeId: string) => {
	return updateInstance(instanceId, { pubTypeId });
};
