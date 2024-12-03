import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunitiesId, PubsId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { PubEditor } from "~/app/components/pubs/PubEditor/PubEditor";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getCommunityBySlug } from "~/lib/db/queries";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";

export async function generateMetadata({
	params: { pubId, communitySlug },
}: {
	params: { pubId: string; communitySlug: string };
}): Promise<Metadata> {
	const community = await getCommunityBySlug(communitySlug);
	if (!community) {
		return { title: "Community Not Found" };
	}

	const pub = await getPubsWithRelatedValuesAndChildren(
		{ pubId: pubId as PubsId, communityId: community.id as CommunitiesId },
		{
			withPubType: true,
			withStage: true,
		}
	);

	if (!pub) {
		return { title: "Pub Not Found" };
	}

	// TODO: replace with proper title https://github.com/pubpub/platform/issues/736
	const title = pub.values.find((v) => /title/.test(v.fieldSlug))?.value;

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

	// TODO: something else if user doesn't have permission?
	if (!pubId || !communitySlug || !canUpdatePub) {
		return null;
	}

	const community = await getCommunityBySlug(communitySlug);

	if (community === null) {
		notFound();
	}

	const pub = await getPubsWithRelatedValuesAndChildren(
		{ pubId: params.pubId as PubsId, communityId: community.id as CommunitiesId },
		{
			withPubType: true,
			withStage: true,
		}
	);

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
			title={
				<div className="flex flex-col items-center">
					Edit pub
					<span className="text-sm font-normal text-muted-foreground">
						Form will save when you click save
					</span>
				</div>
			}
			right={
				<Button variant="link">
					<Link href={`/c/${communitySlug}/pubs/${pub.id}`}>View Pub</Link>
				</Button>
			}
		>
			<div className="flex justify-center py-10">
				<div className="max-w-prose">
					<PubEditor searchParams={searchParams} pubId={pub.id} formId={formId} />
				</div>
			</div>
		</ContentLayout>
	);
}
