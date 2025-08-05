import { notFound, redirect } from "next/navigation";

import type { Action } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getActionConfigDefaults } from "~/lib/server/actions";
import { findCommunityBySlug } from "~/lib/server/community";
import { ActionConfigDefaultForm } from "./ActionConfigDefaultForm";

type Props = {
	params: {
		action: Action;
		communitySlug: string;
	};
};

export default async function Page(props: Props) {
	const community = await findCommunityBySlug(props.params.communitySlug);

	if (!community) {
		notFound();
	}

	const loginData = await getPageLoginData();

	const userCanEditCommunity = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	);

	if (!userCanEditCommunity) {
		redirect(`/c/${props.params.communitySlug}/unauthorized`);
	}

	const actionConfigDefaults = await getActionConfigDefaults(community.id, props.params.action);

	return (
		<div>
			<h1>{props.params.action} Action Settings</h1>
			<ActionConfigDefaultForm
				communityId={community.id}
				action={props.params.action}
				values={actionConfigDefaults}
			/>
		</div>
	);
}
