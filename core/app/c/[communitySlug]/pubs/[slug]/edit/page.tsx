import type { Metadata } from "next";

import { cache } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PageTitleWithStatus } from "~/app/components/pubs/PubEditor/PageTitleWithStatus";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { pubPath } from "~/lib/paths";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";

const getPubsWithRelatedValuesAndChildrenCached = cache(
	async (communityId: CommunitiesId, slug: string, userId?: UsersId) => {
		return getPubsWithRelatedValuesAndChildren(
			{
				communityId,
				slug,
				userId,
			},
			{
				withPubType: true,
			}
		);
	}
);

export async function generateMetadata({
	params: { slug, communitySlug },
}: {
	params: { slug: string; communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	const pub = await getPubsWithRelatedValuesAndChildrenCached(
		community.id as CommunitiesId,
		slug
	);

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
	params: { slug: string; communitySlug: string };
	searchParams: Record<string, string>;
}) {
	const { slug, communitySlug } = params;

	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const canUpdatePub = await userCan(
		Capabilities.updatePubValues,
		{
			type: MembershipType.pub,
			slug,
			communityId: community.id as CommunitiesId,
		},
		user.id
	);

	if (!canUpdatePub) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const pub = await getPubsWithRelatedValuesAndChildrenCached(
		community.id as CommunitiesId,
		params.slug,
		user.id
	);

	if (!pub) {
		notFound();
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
					<Link href={pubPath(communitySlug, pub.slug)}>View Pub</Link>
				</Button>
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose">
					<PubEditor
						withSlug={true}
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
