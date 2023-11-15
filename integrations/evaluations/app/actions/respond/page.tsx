import { notFound } from "next/navigation";
import { assert, expect } from "utils";
import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { Respond } from "./respond";
import { SafeUser } from "@pubpub/sdk";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
		intent: "accept" | "decline" | "info";
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId, intent } = props.searchParams;
	if (!(instanceId && pubId)) {
		notFound();
	}
	const user: SafeUser = JSON.parse(expect(cookie("user")));
	const instanceConfig = expect(await getInstanceConfig(instanceId), "Instance not configured");
	const instanceState = await getInstanceState(instanceId, pubId);
	const pub = await client.getPub(instanceId, pubId);
	const status = instanceState?.[user.id]?.status;
	if (status !== "invited" && status !== "declined") {
		// TODO: Show a more informative error message or redirect based on status.
		notFound();
	}
	return (
		<Respond
			intent={intent}
			instanceId={instanceId}
			instanceConfig={instanceConfig}
			pub={pub}
		/>
	);
}
