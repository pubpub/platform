import { notFound, redirect } from "next/navigation"

import type { SafeUser } from "@pubpub/sdk"
import { expect } from "utils"

import { getInstanceConfig, getInstanceState } from "~/lib/instance"
import { client } from "~/lib/pubpub"
import { cookie } from "~/lib/request"
import { assertIsInvited } from "~/lib/types"
import { decline } from "./actions"
import { Respond } from "./respond"

type Props = {
	searchParams: {
		instanceId: string
		pubId: string
		intent: "accept" | "decline" | "info"
	}
}

export default async function Page(props: Props) {
	const { instanceId, pubId, intent } = props.searchParams
	if (!(instanceId && pubId)) {
		notFound()
	}
	const user: SafeUser = JSON.parse(expect(cookie("user")))
	const instanceConfig = expect(await getInstanceConfig(instanceId), "Instance not configured")
	const instanceState = await getInstanceState(instanceId, pubId)
	const pub = await client.getPub(instanceId, pubId)
	const evaluator = expect(instanceState?.[user.id], "User was not invited to evaluate this pub")
	const redirectParams = `?token=${cookie("token")}&instanceId=${instanceId}&pubId=${pubId}`
	assertIsInvited(evaluator)
	const evaluationManager =
		pub.assignee ?? (await client.getOrCreateUser(instanceId, { userId: evaluator.invitedBy }))
	// If the evaluator visited this page with the intent to get more information
	// (either through the invitation email or the declined screen) or to accept
	// the invite (through the invitation email), show them the response page.
	if (intent === "info" || intent === "accept") {
		return (
			<Respond
				intent={intent}
				instanceId={instanceId}
				instanceConfig={instanceConfig}
				pub={pub}
				evaluationManager={evaluationManager}
			/>
		)
	}
	// If the evaluator visited this page with the intent to decline, immediately
	// update their status to "declined" and redirect them to the declined page.
	if (intent === "decline") {
		if (evaluator.status !== "declined") {
			await decline(instanceId, pubId)
		}
		redirect(`/actions/respond/declined${redirectParams}`)
	}
	// Users should only ever visit the respond page with an `intent` search param.
	// If they happen to visit the page by manually constructing the URL without an
	// intent, or through unanticipated means, we use their current evaluation status
	// to decide what to show.
	switch (evaluator.status) {
		case "accepted":
			redirect(`/actions/respond/accepted${redirectParams}`)
		case "declined":
			redirect(`/actions/respond/declined${redirectParams}`)
		case "received":
			redirect(`/actions/respond/accepted${redirectParams}`)
		case "invited":
			return (
				<Respond
					intent="info"
					instanceId={instanceId}
					instanceConfig={instanceConfig}
					pub={pub}
					evaluationManager={evaluationManager}
				/>
			)
	}
}
