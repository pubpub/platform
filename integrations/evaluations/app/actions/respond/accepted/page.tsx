import { notFound } from "next/navigation"

import { expect } from "utils"

import { getInstanceConfig } from "~/lib/instance"
import { client } from "~/lib/pubpub"

type Props = {
	searchParams: {
		instanceId: string
		pubId: string
	}
}

export default async function Page(props: Props) {
	const { instanceId, pubId } = props.searchParams
	if (!(instanceId && pubId)) {
		notFound()
	}
	const instanceConfig = expect(await getInstanceConfig(instanceId), "Instance not configured")
	const pub = await client.getPub(instanceId, pubId)
	const submissionUrl = pub.values["legacy-unjournal:url"] as string
	const submissionTitle = pub.values[instanceConfig.titleFieldSlug] as string

	// TODO: Get copy from Jeff/Gabe
	return (
		<div className="prose max-w-none">
			<p>
				Thanks for accepting the invite to evaluate{" "}
				<a target="_blank" href={submissionUrl}>
					"{submissionTitle}"
				</a>{" "}
				for{" "}
				<a target="_blank" href="https://unjournal.org">
					<em>The Unjournal</em>
				</a>
				! We'll send you an email with instructions on how to submit your evaluation.
			</p>
		</div>
	)
}
