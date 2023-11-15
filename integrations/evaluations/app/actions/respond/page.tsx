import { notFound } from "next/navigation";
import { assert, expect } from "utils";
import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { Respond } from "./respond";
import { SafeUser } from "@pubpub/sdk";
import { decline } from "./actions";
import { assertIsInvited } from "~/lib/types";

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
	const evaluator = expect(instanceState?.[user.id], "User was not invited to evaluate this pub");
	assertIsInvited(evaluator);
	// Immediately decline the invitation if the user intends to decline.
	if (evaluator.status !== "declined" && intent === "decline") {
		await decline(instanceId, pubId);
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
