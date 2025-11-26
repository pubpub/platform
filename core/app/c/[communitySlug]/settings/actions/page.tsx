import Link from "next/link"
import { notFound } from "next/navigation"
import { Activity } from "lucide-react"

import { Capabilities, MembershipType } from "db/public"
import { cn } from "utils"

import { actions } from "~/actions/api"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToLogin, redirectToUnauthorized } from "~/lib/server/navigation/redirects"
import { ContentLayout } from "../../ContentLayout"

type Props = {
	params: Promise<{ communitySlug: string }>
}

export default async function Page(_props: Props) {
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()])

	if (!user) {
		redirectToLogin()
	}

	if (!community) {
		notFound()
	}

	const loginData = await getPageLoginData()

	const userCanEditCommunity = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	)

	if (!userCanEditCommunity) {
		return await redirectToUnauthorized()
	}

	return (
		<ContentLayout
			title={
				<>
					<Activity size={20} strokeWidth={1} className="mr-2 text-gray-500" />
					Action Settings
				</>
			}
		>
			<div className="container ml-0 max-w-(--breakpoint-md) px-4 py-6 md:px-6">
				<p className="mb-4 text-muted-foreground">
					Set default configuration values for your actions. <br />
					These defaults will be applied to new instances of actions in your community.
				</p>
				<div className="flex flex-col">
					{Object.values(actions).map((action, idx) => (
						<Link
							key={action.name}
							href={`/c/${community.slug}/settings/actions/${action.name}`}
						>
							<div
								className={cn(
									"border border-t-0 p-2 hover:bg-gray-50",
									idx === 0 && "rounded-t border-t",
									idx === Object.values(actions).length - 1 && "rounded-b"
								)}
							>
								<div className="flex items-center">
									<action.icon
										size={16}
										strokeWidth={1}
										className="mr-2 text-gray-500"
									/>
									<h2 className="font-medium text-lg">{action.name}</h2>
								</div>
								<p className="text-muted-foreground text-sm">
									{action.description}
								</p>
							</div>
						</Link>
					))}
				</div>
			</div>
		</ContentLayout>
	)
}
