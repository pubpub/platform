import { client } from "./pubpub";
import { InstanceConfig, InstanceState } from "./types";

export const getInstanceConfig = async (
	instanceId: string
): Promise<InstanceConfig | undefined> => {
	return await client.getInstanceConfig(instanceId);
};

export const setInstanceConfig = async (
	instanceId: string,
	instanceConfig: InstanceConfig
): Promise<any> => {
	return await client.setInstanceConfig(instanceId, instanceConfig);
};

export const getInstanceState = async (
	instanceId: string,
	pubId: string
): Promise<InstanceState | undefined> => {
	return await client.getInstanceState(instanceId, pubId);
};

export const setInstanceState = async (
	instanceId: string,
	pubId: string,
	instanceState: InstanceState
): Promise<any> => {
	return await client.setInstanceState(instanceId, pubId, instanceState);
};
