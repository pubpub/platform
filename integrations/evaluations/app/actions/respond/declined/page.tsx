import Link from "next/link";
import { notFound } from "next/navigation";

import { expect } from "utils";

import { getInstanceConfig } from "~/lib/instance";
import { client } from "~/lib/pubpub";

type Props = {
	searchParams: Promise<{
		pubId: string;
		instanceId: string;
	}>;
};

export default async function Page(props: Props) {
	const { instanceId, pubId } = (await props.searchParams);
	if (!(instanceId && pubId)) {
		notFound();
	}
	const instanceConfig = expect(await getInstanceConfig(instanceId), "Instance not configured");
	const pub = await client.getPub(instanceId, pubId);
	const params = new URLSearchParams((await props.searchParams));
	params.set("intent", "info");
	const infoUrl = "/actions/respond" + "?" + params.toString();
	const submissionUrl = pub.values["legacy-unjournal:url"] as string;
	const submissionTitle = pub.values[instanceConfig.titleFieldSlug] as string;

	return (
		<div className="prose max-w-none">
			<p>
				You have declined to evaluate{" "}
				<a target="_blank" href={submissionUrl}>
					"{submissionTitle}"
				</a>{" "}
				for{" "}
				<a target="_blank" href="https://unjournal.org">
					<em>The Unjournal</em>
				</a>
				. Thank you for considering our invitation.
			</p>
			<p>
				You may read more about the research, and our evaluation process, on{" "}
				<Link href={infoUrl}>this page</Link>—where you may also opt to accept or request
				more information.
			</p>
			<h2>Feedback and suggested evaluators (optional)</h2>
			<p>
				We would also appreciate your suggestions for other potential evaluators for this
				research. As a sign that we value this, if you suggest someone who ends up
				evaluating this research who was not already on our list, we will award you $50. You
				can suggest potential evaluators in the form{" "}
				<a
					target="_blank"
					href="https://coda.io/form/Decline-evaluation-feedback-form-suggesting-alternate-evaluators_d3YiJu_WNNW"
				>
					here
				</a>
				.
			</p>
			<p>
				We are also eager to understand how to better recruit evaluators. In the same{" "}
				<a
					target="_blank"
					href="https://coda.io/form/Decline-evaluation-feedback-form-suggesting-alternate-evaluators_d3YiJu_WNNW"
				>
					form
				</a>
				, you can also let us know why you decided not to accept this assignment, and what
				might make this more attractive to you and others in the future. Again, to show that
				we value this, we will provide $50 awards for people who offer particularly useful
				advice. (We commit to offering at least one such award for every five people
				submitting suggestions, not to exceed $50 in total awards per month).
			</p>
			<p>
				Alternatively, you can send a <a href="mailto:contact@unjournal.org">quick email</a>{" "}
				to let us know your thoughts.
			</p>
		</div>
	);
}
