import { notFound, redirect } from "next/navigation";
import { Activity } from "lucide-react";

import type { Action } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { PubFieldProvider } from "ui/pubFields";
import { TokenProvider } from "ui/tokens";

import { actions, getActionByName } from "~/actions/api";
import { resolveFieldConfig } from "~/actions/api/server";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getActionConfigDefaults } from "~/lib/server/actions";
import { findCommunityBySlug } from "~/lib/server/community";
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";
import { ActionConfigDefaultForm } from "./ActionConfigDefaultForm";

type Props = {
	params: {
		action: Action;
		communitySlug: string;
	};
};

export default async function Page(props: Props) {
	const params = await props.params;

	const [loginData, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()]);

	if (!community) {
		notFound();
	}

	if (!loginData || !loginData.user) {
		redirectToLogin();
	}

	const actionConfigDefaults = await getActionConfigDefaults(
		community.id,
		params.action
	).executeTakeFirst();

	const [userCanEditCommunity, pubFields, resolvedFieldConfig] = await Promise.all([
		userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			loginData.user.id
		),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
		resolveFieldConfig(params.action, "config", {
			communityId: community.id,
			config: actionConfigDefaults?.config as Record<string, unknown> | undefined,
		}),
	]);

	if (!userCanEditCommunity) {
		return await redirectToUnauthorized();
	}

	const { tokens = {} } = getActionByName(params.action);
	const actionTitle = params.action[0].toUpperCase() + params.action.slice(1);

	const action = actions[params.action];
	if (!action) {
		notFound();
	}

	return (
		<ContentLayout
			title={
				<>
					<action.icon size={20} strokeWidth={1} className="mr-2 text-gray-500" />
					{actionTitle} Action Defaults
				</>
			}
		>
			<div className="container ml-0 max-w-screen-md px-4 py-6 md:px-6">
				<div>
					<p className="mb-4 text-muted-foreground">
						Set default configuration values for the {actionTitle} action. <br /> These
						defaults will be applied to new instances of this action in your community.
					</p>
				</div>
				<PubFieldProvider pubFields={pubFields}>
					<TokenProvider tokens={tokens}>
						<ActionConfigDefaultForm
							communityId={community.id}
							action={params.action}
							values={
								actionConfigDefaults?.config as Record<string, unknown> | undefined
							}
							fieldConfig={resolvedFieldConfig}
						/>
					</TokenProvider>
				</PubFieldProvider>
			</div>
		</ContentLayout>
	);
}
