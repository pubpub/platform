import { notFound } from "next/navigation";
import { expect } from "utils";
import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { Declined } from "./declined";
import { Evaluate } from "./evaluate";
import { Respond } from "./respond";
import { Submitted } from "./submitted";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	if (!(instanceId && pubId)) {
		notFound();
	}
	const user = JSON.parse(expect(cookie("user")));
	const instanceConfig = await getInstanceConfig(instanceId);
	const instanceState = await getInstanceState(instanceId, pubId);
	const pub = await client.getPub(instanceId, pubId);
	const pubType = await client.getPubType(instanceId, instanceConfig!.pubTypeId);
	if (instanceConfig === undefined) {
		throw new Error("Instance not configured");
	}
	switch (instanceState?.[user.id]?.status) {
		// If the evaluator has been invited, but neither accepted nor rejected,
		// render the response page.
		case "invited":
			return <Respond instanceId={instanceId} pub={pub} userId={user.id} />;
		// If they have responded "Accept", render the evaluation form.
		case "accepted":
			return (
				<Evaluate
					instanceId={instanceId}
					instanceConfig={instanceConfig}
					pub={pub}
					pubType={pubType}
				/>
			);
		// If they have responded "Decline", render the decline page.
		case "declined":
			return <Declined />;
		case "submitted":
			// If they have submitted an evaluation, render the submitted page.
			return <Submitted />;
		default:
			throw new Error("Invalid evaluation state");
	}
}
