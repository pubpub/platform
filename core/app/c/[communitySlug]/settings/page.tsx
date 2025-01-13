import type { Metadata } from "next";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { findCommunityBySlug } from "~/lib/server/community";

export const metadata: Metadata = {
	title: "Community Settings",
};

export default async function Page({ params }: { params: { communitySlug: string } }) {
	const { user } = await getPageLoginData();
	const { communitySlug } = params;

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	if (
		!(await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		))
	) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	return (
		<main className="flex flex-col items-start gap-y-4">
			<h1 className="text-xl font-bold">Community Settings</h1>
			<div className="prose">
				<ul>
					<li>
						<Link className="underline" href={`/c/${communitySlug}/settings/tokens`}>
							Tokens
						</Link>
					</li>
					<li>
						<Link className="underline" href={`/c/${communitySlug}/developers/docs`}>
							API Docs
						</Link>
					</li>
				</ul>
			</div>
		</main>
	);
}
