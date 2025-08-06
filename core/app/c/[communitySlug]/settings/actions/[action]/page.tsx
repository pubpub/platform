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

	const actionConfigDefaults = await getActionConfigDefaults(
		community.id,
		props.params.action
	).executeTakeFirst();

	return (
		<div className="container mx-auto px-4 py-12 md:px-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">
						{props.params.action[0].toUpperCase() + props.params.action.slice(1)} Action
						Settings
					</h1>
					<p className="text-muted-foreground">
						Set default configuration values for the{" "}
						{props.params.action[0].toUpperCase() + props.params.action.slice(1)}{" "}
						action. These defaults will be applied to new instances of this action in
						your community.
					</p>
				</div>
				<ActionConfigDefaultForm
					communityId={community.id}
					action={props.params.action}
					values={actionConfigDefaults?.config as Record<string, unknown> | undefined}
				/>
			</div>
		</div>
	);
}
