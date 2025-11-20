import type { Metadata } from "next"

import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { SidebarProvider, SidebarTrigger } from "ui/sidebar"
import { cn } from "utils"

import { LAST_VISITED_COOKIE } from "~/app/components/LastVisitedCommunity/constants"
import SetLastVisited from "~/app/components/LastVisitedCommunity/SetLastVisited"
import { CommunityProvider } from "~/app/components/providers/CommunityProvider"
import { SearchDialog } from "~/app/components/SearchDialog"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { getCommunityRole } from "~/lib/authentication/roles"
import { findCommunityBySlug } from "~/lib/server/community"
import SideNav, { COLLAPSIBLE_TYPE } from "./SideNav"

type Props = { children: React.ReactNode; params: Promise<{ communitySlug: string }> }

export async function generateMetadata(props: {
	params: Promise<{ communitySlug: string }>
}): Promise<Metadata> {
	const params = await props.params
	const community = await findCommunityBySlug(params.communitySlug)

	return {
		title: {
			template: `%s | ${community?.name ?? "PubPub"}`,
			default: community?.name ? `${community?.name} on PubPub` : "PubPub",
		},
	}
}

export default async function MainLayout(props: Props) {
	const params = await props.params

	const { children } = props

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	])

	if (!community) {
		return notFound()
	}

	const cookieStore = await cookies()
	// need to manually write the name of the cookie here
	// bc we can't import SIDEBAR_COOKIE_NAME here because it's in a "use client" file
	const defaultOpenCookie = cookieStore.get("sidebar:state")
	// open by default, only if cookie is explicitly set to false will it be closed
	const defaultOpen = defaultOpenCookie?.value !== "false"

	const role = getCommunityRole(user, community)

	if (!role) {
		redirect("/settings")
	}

	const availableCommunities = user?.memberships.map((m) => m.community) ?? []

	const lastVisited = cookieStore.get(LAST_VISITED_COOKIE)

	return (
		<CommunityProvider community={community}>
			{params.communitySlug !== lastVisited?.value && (
				<SetLastVisited communitySlug={params.communitySlug} />
			)}
			<div className="flex min-h-screen flex-col md:flex-row">
				<SidebarProvider defaultOpen={defaultOpen}>
					<SideNav community={community} availableCommunities={availableCommunities} />
					<div className="relative flex-auto px-4 py-4 md:px-12">{children}</div>
					<SidebarTrigger
						className={cn(
							"fixed bottom-2 right-2 z-50",
							COLLAPSIBLE_TYPE === "icon" && "md:hidden"
						)}
					/>
					<SearchDialog />
				</SidebarProvider>
			</div>
		</CommunityProvider>
	)
}
