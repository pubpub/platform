import { client } from "~/lib/pubpub";

export type EmailTemplate = { subject: string; message: string };

export enum InviteStatus {
	Invited,
	Accepted,
	Declined,
	Submitted,
}

export type InstanceConfig = {
	pubTypeId: string;
	evaluatorFieldSlug: string;
	titleFieldSlug: string;
	template: EmailTemplate;
};

export type InstanceState = {
	[userId: string]: {
		status: InviteStatus;
		inviteTemplate: EmailTemplate;
		inviteTime: string;
	};
};

export const makeInstanceConfig = (): InstanceConfig => ({
	pubTypeId: "",
	template: { subject: "", message: "" },
	evaluatorFieldSlug: "",
	titleFieldSlug: "",
});

export const getInstanceConfig = async (instanceId: string) => {
	return await client.getInstanceConfig(instanceId);
};

export const setInstanceConfig = async (
	instanceId: string,
	instanceConfig: InstanceConfig
): Promise<any> => {
	return await client.setInstanceConfig(instanceId, instanceConfig);
};

export const getInstanceState = async (instanceId: string, pubId: string) => {
	return await client.getInstanceState(instanceId, pubId);
};

export const setInstanceState = async (
	instanceId: string,
	pubId: string,
	instanceState: InstanceState
): Promise<any> => {
	return await client.setInstanceState(instanceId, pubId, instanceState);
};
