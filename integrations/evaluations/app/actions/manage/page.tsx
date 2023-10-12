import { getInstanceConfig, getInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { EmailForm } from "./emailForm";
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
	// Fetch the submission pub and its children
	const submission = await client.getPub(instanceId, pubId);
	// Load user info for each of the submission's child evaluations
	const evaluators =
		submission.children.length > 0
			? await client.getUsers(
					instanceId,
					submission.children
						// Only consider the children that are evaluations
						.filter((child) => child.pubTypeId === instanceConfig.pubTypeId)
						// Extract the evaluator user id
						.map((child) => child.values["unjournal:evaluator"] as string)
			  )
			: [];

	return (
		<EmailForm
			instanceId={instanceId}
			submission={submission}
			evaluators={evaluators}
			template={instanceConfig?.template}
			instanceState={instanceState}
		/>
	);
}
