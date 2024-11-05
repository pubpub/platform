import type { Metadata } from "next";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { SidebarProvider, SidebarTrigger } from "ui/sidebar";
import { cn } from "utils";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: { communitySlug: string } };

export async function generateMetadata({
	params,
}: {
	params: { communitySlug: string };
}): Promise<Metadata> {
	const community = await findCommunityBySlug(params.communitySlug);

	return {
		title: {
			template: `%s | ${community?.name ?? "PubPub"}`,
			default: community?.name ? `${community?.name} on PubPub` : "PubPub",
		},
	};
}

export const COLLAPSIBLE_TYPE = "icon";

export default async function MainLayout({ children, params }: Props) {
	const { user } = await getLoginData();

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return null;
	}

	const cookieStore = cookies();
	// need to manually write the name of the cookie here
	// bc we can't import SIDEBAR_COOKIE_NAME here because it's in a "use client" file
	const defaultOpenCookie = cookieStore.get("sidebar:state");
	const defaultOpen = defaultOpenCookie?.value === "true";

	const role = getCommunityRole(user, community);

	if (role === "contributor") {
		// TODO: figure something out for this
		notFound();
	}

	// const availableCommunities = await getAvailableCommunities(user.id as UsersId);
	const availableCommunities = user?.memberships.map((m) => m.community) ?? [];

	return (
		<CommunityProvider community={community}>
			<div className="flex min-h-screen flex-col md:flex-row">
				<SidebarProvider defaultOpen={defaultOpen}>
					<SideNav
						community={community}
						availableCommunities={availableCommunities}
						collapsible="icon"
					/>

					<div className="relative flex-auto px-4 py-4 md:px-12">
						<SidebarTrigger
							className={cn(
								"absolute md:left-2",
								COLLAPSIBLE_TYPE === "icon" && "hidden"
							)}
						/>
						{children}
					</div>
				</SidebarProvider>
			</div>
		</CommunityProvider>
	);
}
