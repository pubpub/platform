import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { EvaluatorInviteForm } from "./EvaluatorInviteForm";
import { expect } from "utils";

type Props = {
	searchParams: {
		instanceId: string;
		pubId: string;
	};
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams;
	const instanceConfig = expect(await getInstanceConfig(instanceId));
	const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
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
			new Date(instanceState.value[a.id]?.inviteTime).getTime() -
			new Date(instanceState.value[b.id]?.inviteTime).getTime()
	);

	return (
		<EvaluatorInviteForm
			instanceId={instanceId}
			pub={pub}
			evaluators={evaluators}
			instanceConfig={instanceConfig}
			instanceState={instanceState.value}
		/>
	);
}
