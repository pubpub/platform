import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { type PubTypesId } from "db/public";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCanCreatePub } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";

export async function generateMetadata(props: {
	params: Promise<{ pubId: string; communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;

	const { communitySlug } = params;

	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	return { title: `Create pub in ${community.name}` };
}

export default async function Page(props: {
	params: Promise<{ communitySlug: string }>;
	searchParams: Promise<Record<string, string> & { pubTypeId: PubTypesId }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const { communitySlug } = params;

	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const canCreatePub = await userCanCreatePub({
		communityId: community.id,
		userId: user.id,
		pubTypeId: searchParams.pubTypeId,
		// No formSlug because we're just checking if there are any authorized forms
		// We validate that the user can create a pub with the specified form in the create action
	});

	if (!canCreatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const htmlFormId = `create-pub`;

	return (
		<ContentLayout
			left={
				<Button form={htmlFormId} type="submit">
					Save
				</Button>
			}
			title={<PageTitleWithStatus title="Create pub" />}
			right={<div />}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose flex-1">
					<PubEditor
						searchParams={searchParams}
						communityId={community.id}
						htmlFormId={htmlFormId}
						// PubEditor checks for the existence of the stageId prop
						{...(searchParams["stageId"] ? { stageId: searchParams["stageId"] } : {})}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
