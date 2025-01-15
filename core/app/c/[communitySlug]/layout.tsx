import type { Metadata } from "next";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { Sidebar, SidebarProvider, SidebarTrigger } from "ui/sidebar";
import { cn } from "utils";

import { CommunityProvider } from "~/app/components/providers/CommunityProvider";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { getCommunityRole } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import SideNav, { COLLAPSIBLE_TYPE } from "./SideNav";

type Props = { children: React.ReactNode; params: Promise<{ communitySlug: string }> };

export async function generateMetadata(props: {
	params: Promise<{ communitySlug: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const community = await findCommunityBySlug(params.communitySlug);

	return {
		title: {
			template: `%s | ${community?.name ?? "PubPub"}`,
			default: community?.name ? `${community?.name} on PubPub` : "PubPub",
		},
	};
}

export default async function MainLayout(props: Props) {
	const params = await props.params;

	const { children } = props;

	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(params.communitySlug);
	if (!community) {
		return notFound();
	}

	const cookieStore = cookies();
	// need to manually write the name of the cookie here
	// bc we can't import SIDEBAR_COOKIE_NAME here because it's in a "use client" file
	const defaultOpenCookie = cookieStore.get("sidebar:state");
	// open by default, only if cookie is explicitly set to false will it be closed
	const defaultOpen = defaultOpenCookie?.value !== "false";

	const role = getCommunityRole(user, community);

	if (!role) {
		redirect("/settings");
	}

	const availableCommunities = user?.memberships.map((m) => m.community) ?? [];

	return (
		<CommunityProvider community={community}>
			<div className="flex min-h-screen flex-col md:flex-row">
				<SidebarProvider defaultOpen={defaultOpen}>
					<SideNav community={community} availableCommunities={availableCommunities} />

					<div className="relative flex-auto px-4 py-4 md:px-12">{children}</div>

					<SidebarTrigger
						className={cn(
							"fixed bottom-2 left-2",
							COLLAPSIBLE_TYPE === "icon" && "md:hidden"
						)}
					/>
				</SidebarProvider>
			</div>
		</CommunityProvider>
	);
}
