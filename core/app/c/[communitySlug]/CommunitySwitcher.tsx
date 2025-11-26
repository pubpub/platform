import type { CommunityData } from "~/lib/server/community"

import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { ChevronsUpDown } from "ui/icon"
import { SidebarMenuButton } from "ui/sidebar"
import { cn } from "utils"

import { constructRedirectToBaseCommunityPage } from "~/lib/server/navigation/redirects"

type Props = {
	community: NonNullable<CommunityData>
	availableCommunities: NonNullable<CommunityData>[]
}

const CommunitySwitcher: React.FC<Props> = async ({ community, availableCommunities }) => {
	const avatarClasses = "rounded-md size-6"
	const textClasses = "flex-auto text-base font-semibold w-44 text-left"

	const onlyOneCommunity = availableCommunities.length === 1

	// pre-compute redirect urls for all available communities
	const communityRedirectUrls = await Promise.all(
		availableCommunities.map(async (option) => ({
			communityId: option.id,
			redirectUrl: await constructRedirectToBaseCommunityPage({
				communitySlug: community.slug === option.slug ? undefined : option.slug,
			}),
		}))
	)

	const redirectUrlMap = new Map(
		communityRedirectUrls.map(({ communityId, redirectUrl }) => [communityId, redirectUrl])
	)

	const button = (
		<SidebarMenuButton
			aria-label="Select a community"
			className={`h-full group-data-[collapsible=icon]:ml-0.5 group-data-[collapsible=icon]:p-0! md:py-1 ${onlyOneCommunity ? "cursor-default" : ""}`}
		>
			<Avatar className={cn("grid size-6 place-items-center", avatarClasses)}>
				<AvatarImage
					src={community.avatar || undefined}
					height={24}
					className="aspect-auto size-auto h-6"
				/>
				<AvatarFallback>{community.name[0]}</AvatarFallback>
			</Avatar>
			<span className={textClasses}>{community.name}</span>
			{!onlyOneCommunity && <ChevronsUpDown className="ml-auto" />}
		</SidebarMenuButton>
	)

	if (onlyOneCommunity) {
		return button
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
			<DropdownMenuContent className="w-(--radix-popper-anchor-width) min-w-52" side="right">
				{availableCommunities
					.filter((option) => {
						return option?.slug !== community.slug
					})
					.map((option) => {
						return (
							<DropdownMenuItem asChild key={option.id}>
								<Link
									href={redirectUrlMap.get(option.id) || `/c/${option.slug}`}
									className="flex cursor-pointer items-center hover:bg-gray-50"
								>
									<Avatar
										className={cn("grid place-items-center", avatarClasses)}
									>
										<AvatarImage
											src={option.avatar || undefined}
											className="object-cover"
										/>
										<AvatarFallback>{option.name[0]}</AvatarFallback>
									</Avatar>
									<span className={cn(textClasses, "font-medium")}>
										{option.name}
									</span>
								</Link>
							</DropdownMenuItem>
						)
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default CommunitySwitcher
