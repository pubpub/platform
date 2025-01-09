import type { Metadata } from "next";

import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CommunitiesId, PubsId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";

const getPubsWithRelatedValuesAndChildrenCached = cache(
	async ({ pubId, communityId }: { pubId: PubsId; communityId: CommunitiesId }) => {
		return getPubsWithRelatedValuesAndChildren(
			{
				pubId,
				communityId,
			},
			{
				withPubType: true,
			}
		);
	}
);

export async function generateMetadata({
	params: { pubId, communitySlug },
}: {
	params: { pubId: string; communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	const pub = await getPubsWithRelatedValuesAndChildrenCached({
		pubId: pubId as PubsId,
		communityId: community.id as CommunitiesId,
	});

	if (!pub) {
		return { title: "Pub Not Found" };
	}

	const title = getPubTitle(pub);

	if (!title) {
		return { title: `Edit Pub ${pub.id}` };
	}

	return { title: title as string };
}

export default async function Page({
	params,
	searchParams,
}: {
	params: { pubId: PubsId; communitySlug: string };
	searchParams: Record<string, string>;
}) {
	const { pubId, communitySlug } = params;

	const { user } = await getPageLoginData();

	const canUpdatePub = await userCan(
		Capabilities.updatePubValues,
		{
			type: MembershipType.pub,
			pubId,
		},
		user.id
	);

	if (!pubId || !communitySlug) {
		return null;
	}

	if (!canUpdatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const pub = await getPubsWithRelatedValuesAndChildrenCached({
		pubId: params.pubId as PubsId,
		communityId: community.id,
	});

	if (!pub) {
		return null;
	}

	const formId = `edit-pub-${pub.id}`;

	return (
		<ContentLayout
			left={
				<Button form={formId} type="submit">
					Save
				</Button>
			}
			title={<PageTitleWithStatus title="Edit pub" />}
			right={
				<Button variant="link" asChild>
					<Link href={`/c/${communitySlug}/pubs/${pub.id}`}>View Pub</Link>
				</Button>
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose">
					<PubEditor
						searchParams={searchParams}
						pubId={pub.id}
						formId={formId}
						communityId={community.id}
					/>
				</div>
			</div>
		</ContentLayout>
	);
}
