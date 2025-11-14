import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { Capabilities, MembershipType } from "db/public";
import { Activity } from "ui/icon";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getAutomationRuns } from "~/lib/server/actions";
import { findCommunityBySlug } from "~/lib/server/community";
import { ContentLayout } from "../../ContentLayout";
import { ActionRunsTable } from "./ActionRunsTable";

export const metadata: Metadata = {
	title: "Action Log",
};

export default async function Page(props: {
	params: Promise<{
		communitySlug: string;
	}>;
}) {
	const params = await props.params;

	const { communitySlug } = params;

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!community) {
		notFound();
	}

	const [canEditCommunity, actionRuns] = await Promise.all([
		userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),
		getAutomationRuns(community.id).execute(),
	]);

	if (!canEditCommunity) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	return (
		<ContentLayout
			title={
				<>
					<Activity size={24} strokeWidth={1} className="mr-2 text-gray-500" /> Action
					Logs
				</>
			}
		>
			<div className="m-4">
				<ActionRunsTable actionRuns={actionRuns} communitySlug={community.slug} />
			</div>
		</ContentLayout>
	);
}
