import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";

import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { publicSignupsAllowed } from "~/lib/server/user";

export default async function JoinPage({
	searchParams,
}: {
	searchParams: Promise<{ redirectTo?: string }>;
}) {
	const [community, { user }] = await Promise.all([findCommunityBySlug(), getLoginData()]);

	if (!community) {
		notFound();
	}

	const isAllowedToSignup = await publicSignupsAllowed(community.id);
	if (!isAllowedToSignup) {
		// no public signups allowed
		notFound();
	}

	const { redirectTo } = await searchParams;
	if (!user) {
		redirect(`/c/${community.slug}/public/signup?redirectTo=${redirectTo}`);
	}

	if (user.memberships.some((m) => m.communityId === community.id)) {
		return (
			<Card>
				<CardContent>
					You are already a member of this community
					<Button>
						<Link href={redirectTo ?? "/"}>Continue</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return <div>Join</div>;
}
