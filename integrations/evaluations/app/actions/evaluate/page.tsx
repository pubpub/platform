import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { expect } from "utils";
import { InviteStatus, getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { Evaluate } from "./evaluate";
import { Respond } from "./respond";
import { Submitted } from "./submitted";
import { Declined } from "./declined";

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
	const userId: string = JSON.parse(expect(cookies().get("userId")).value);
	const instanceConfig = await getInstanceConfig(instanceId);
	const instanceState = await getInstanceState(instanceId, pubId);
	const pub = await client.getPub(instanceId, pubId);
	const pubType = await client.getPubType(instanceId, instanceConfig!.pubTypeId);
	if (instanceConfig === undefined) {
		throw new Error("Instance not configured");
	}
	switch (instanceState?.[userId]?.status) {
		// If the evaluator has been invited, but neither accepted nor rejected,
		// render the response page.
		case InviteStatus.Invited:
			return <Respond instanceId={instanceId} pub={pub} userId={userId} />;
		// If they have responded "Accept", render the evaluation form.
		case InviteStatus.Accepted:
			return <Evaluate instanceId={instanceId} pub={pub} pubType={pubType} />;
		// If they have responded "Decline", render the decline page.
		case InviteStatus.Declined:
			return <Declined />;
		case InviteStatus.Submitted:
			// If they have submitted an evaluation, render the submitted page.
			return <Submitted />;
		default:
			throw new Error("Invalid evaluation state");
	}
}
