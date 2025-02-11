import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import type { CommunitiesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
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
	searchParams: Promise<Record<string, string>>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const { communitySlug } = params;

	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const canCreatePub = await userCan(
		Capabilities.createPub,
		{
			type: MembershipType.community,
			communityId: community.id,
		},
		user.id
	);

	if (!canCreatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const formId = `create-pub`;

	// Build the specifiers conditionally since PubEditor checks for the existence of the prop
	const pubEditorSpecifiers: Record<string, string> = {};
	if (searchParams["stageId"]) {
		pubEditorSpecifiers.stageId = searchParams["stageId"];
	}

	return (
		<ContentLayout
			left={
				<Button form={formId} type="submit">
					Save
				</Button>
			}
			title={<PageTitleWithStatus title="Create pub" />}
			right={<div />}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose">
					<PubEditor
						searchParams={searchParams}
						communityId={community.id}
						formId={formId}
						{...pubEditorSpecifiers}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
