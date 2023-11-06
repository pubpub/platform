import { client } from "~/lib/pubpub";

export type EmailTemplate = { subject: string; message: string };

export type InstanceConfig = {
	pubTypeId: string;
	template: EmailTemplate;
};

export type InstanceState = {
	[userId: string]: {
		inviteTemplate: EmailTemplate;
		inviteTime: string;
	};
};

export const makeInstanceConfig = (): InstanceConfig => ({
	pubTypeId: "",
	template: { subject: "", message: "" },
});

export const getInstanceConfig = async (instanceId: string) => {
	const instanceConfig = await client.getInstanceConfig(instanceId);
	return instanceConfig ? instanceConfig as any : undefined;
};

export const setInstanceConfig = async (instanceId: string, instance: any): Promise<any> => {
	return await client.setInstanceConfig(instanceId, instance);
};

export const getInstanceState = async (instanceId: string, pubId: string) => {
	const instanceState = await client.getInstanceState(instanceId, pubId);
	return instanceState ? instanceState as any : undefined;
};

export const setInstanceState = async (
	instanceId: string,
	pubId: string,
	state: any
): Promise<any> => {
	return await client.setInstanceState(instanceId, pubId, state);
};
