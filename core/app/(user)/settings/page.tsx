import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card"

import LogoutButton from "~/app/components/LogoutButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { constructRedirectToBaseCommunityPage } from "~/lib/server/navigation/redirects"
import { ResetPasswordButton } from "./ResetPasswordButton"
import { UserInfoForm } from "./UserInfoForm"

export default async function Page() {
	const { user } = await getPageLoginData()

	// pre-compute redirect urls for each community
	const communityRedirectUrls = await Promise.all(
		user.memberships.map(async ({ community }) => ({
			communityId: community.id,
			redirectUrl: await constructRedirectToBaseCommunityPage({
				communitySlug: community.slug,
			}),
		}))
	)

	const redirectUrlMap = new Map(
		communityRedirectUrls.map(({ communityId, redirectUrl }) => [communityId, redirectUrl])
	)

	return (
		<main className="flex min-h-[calc(100vh-(--spacing(16)))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
			<div className="mx-auto grid w-full max-w-6xl gap-2">
				<h1 className="font-semibold text-3xl">Settings</h1>
			</div>
			<div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
				<nav
					className="grid gap-4 text-muted-foreground text-sm"
					x-chunk="dashboard-04-chunk-0"
				>
					<Link href="#" className="font-semibold text-primary">
						General
					</Link>

					<hr />
					{user.memberships.length > 0 && (
						<div className="flex flex-col gap-4">
							<span className="text-primary text-sm">Communities</span>

							<div className="flex flex-col gap-2">
								{user.memberships.map(({ community }) => {
									return (
										<Button
											variant="ghost"
											className="w-full"
											key={community.id}
											asChild
										>
											<Link
												href={
													redirectUrlMap.get(community.id) ||
													`/c/${community.slug}`
												}
												className="flex items-center gap-2 hover:underline"
											>
												<Avatar className="h-6 w-6">
													<AvatarImage
														src={community.avatar || undefined}
													/>
													<AvatarFallback>
														{community.name[0]}
													</AvatarFallback>
												</Avatar>
												<div className="grow">{community.name}</div>
											</Link>
										</Button>
									)
								})}
							</div>
						</div>
					)}
				</nav>
				<div className="grid gap-6">
					<Card x-chunk="dashboard-04-chunk-1">
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>Who are you?</CardDescription>
						</CardHeader>
						<CardContent>
							<UserInfoForm user={user} />
						</CardContent>
					</Card>
					<Card x-chunk="dashboard-04-chunk-2">
						<CardHeader>
							<CardTitle>Reset password</CardTitle>
							<CardDescription>
								Click below to receive an email with a secure link for resetting
								your password.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResetPasswordButton user={user} />
						</CardContent>
					</Card>

					<div className="mt-8">
						<LogoutButton />
					</div>
				</div>
			</div>
		</main>
	)
}
