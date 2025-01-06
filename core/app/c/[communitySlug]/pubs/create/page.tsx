import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import type { CommunitiesId, PubsId, StagesId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";

export async function generateMetadata({
	params: { communitySlug },
}: {
	params: { pubId: string; communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	return { title: `Create pub in ${community.name}` };
}

export default async function Page({
	params,
	searchParams,
}: {
	params: { communitySlug: string };
	searchParams: Record<string, string>;
}) {
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
	const pubEditorSpecifiers: {
		stageId?: StagesId;
		parentId?: PubsId;
		communityId: CommunitiesId;
	} = {
		communityId: community.id,
	};
	if (searchParams["stageId"]) {
		pubEditorSpecifiers.stageId = searchParams["stageId"] as StagesId;
	}
	if (searchParams["parentId"]) {
		pubEditorSpecifiers.parentId = searchParams["parentId"] as PubsId;
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
						formId={formId}
						{...pubEditorSpecifiers}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
