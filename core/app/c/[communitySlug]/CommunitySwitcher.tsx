import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { ChevronsUpDown } from "ui/icon";
import { SidebarMenuButton } from "ui/sidebar";
import { cn } from "utils";

import type { CommunityData } from "~/lib/server/community";
import { constructRedirectToBaseCommunityPage } from "~/lib/server/navigation/redirects";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

const CommunitySwitcher: React.FC<Props> = async function ({ community, availableCommunities }) {
	const avatarClasses =
		"rounded-md w-9 h-9 mr-1 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 border";
	const textClasses = "flex-auto text-base font-semibold w-44 text-left";

	const onlyOneCommunity = availableCommunities.length === 1;

	// pre-compute redirect urls for all available communities
	const communityRedirectUrls = await Promise.all(
		availableCommunities.map(async (option) => ({
			communityId: option.id,
			redirectUrl: await constructRedirectToBaseCommunityPage({ communitySlug: option.slug }),
		}))
	);

	const redirectUrlMap = new Map(
		communityRedirectUrls.map(({ communityId, redirectUrl }) => [communityId, redirectUrl])
	);

	const button = (
		<SidebarMenuButton
			aria-label="Select a community"
			className={`h-full group-data-[collapsible=icon]:!p-0 md:py-1 ${onlyOneCommunity ? "cursor-default" : ""}`}
		>
			<Avatar className={avatarClasses}>
				<AvatarImage src={community.avatar || undefined} />
				<AvatarFallback>{community.name[0]}</AvatarFallback>
			</Avatar>
			<span className={textClasses}>{community.name}</span>
			{!onlyOneCommunity && <ChevronsUpDown className="ml-auto" />}
		</SidebarMenuButton>
	);

	if (onlyOneCommunity) {
		return button;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[--radix-popper-anchor-width] min-w-52" side="right">
				{availableCommunities
					.filter((option) => {
						return option?.slug !== community.slug;
					})
					.map((option) => {
						return (
							<DropdownMenuItem asChild key={option.id}>
								<Link
									href={redirectUrlMap.get(option.id) || `/c/${option.slug}`}
									className="cursor-pointer hover:bg-gray-50"
								>
									<div className="flex items-center gap-2">
										<Avatar className={avatarClasses}>
											<AvatarImage src={option.avatar || undefined} />
											<AvatarFallback>{option.name[0]}</AvatarFallback>
										</Avatar>
										<span className={cn(textClasses, "font-medium")}>
											{option.name}
										</span>
									</div>
								</Link>
							</DropdownMenuItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default CommunitySwitcher;
