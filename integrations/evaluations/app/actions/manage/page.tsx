import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { EvaluatorInviteForm } from "./EvaluatorInviteForm";
import { expect } from "utils";
import { notFound, redirect } from "next/navigation";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	if (!instanceId) {
		notFound();
	}
	const instanceConfig = await getInstanceConfig(instanceId);
	if (instanceConfig === undefined) {
		redirect(`/configure?instanceId=${instanceId}&pubId=${pubId}&action=manage`);
	}
	const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
	console.log(instanceState);
	// Fetch the pub and its children
	const pub = await client.getPub(instanceId, pubId);
	// Load user info for each of the child evaluations
	const evaluators =
		pub.children.length > 0
			? await client.getUsers(
					instanceId,
					pub.children
						// Only consider the children that are evaluations
						.filter((child) => child.pubTypeId === instanceConfig.config.pubTypeId)
						// Extract the evaluator user id
						.map((evaluation) => evaluation.values["unjournal:evaluator"] as string)
			  )
			: [];

	evaluators.sort(
		(a, b) =>
			new Date(instanceState.state[a.id]?.inviteTime).getTime() -
			new Date(instanceState.state[b.id]?.inviteTime).getTime()
	);

	return (
		<EvaluatorInviteForm
			instanceId={instanceId}
			pub={pub}
			evaluators={evaluators}
			instanceConfig={instanceConfig.config}
			instanceState={instanceState.state}
		/>
	);
}
