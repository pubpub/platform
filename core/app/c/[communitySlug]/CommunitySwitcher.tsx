import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { ChevronDown } from "ui/icon";
import { SidebarMenuButton } from "ui/sidebar";

import type { AvailableCommunitiesData, CommunityData } from "~/lib/server/community";
import { HEADER_HEIGHT } from "~/lib/ui";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<AvailableCommunitiesData>;
};

const CommunitySwitcher: React.FC<Props> = function ({ community, availableCommunities }) {
	const avatarClasses =
		"rounded w-9 h-9 mr-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8";
	const textClasses = "flex-auto text-base font-bold w-44 text-left";
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{/* <div className="flex cursor-pointer items-center rounded p-1 hover:bg-gray-200 md:p-2"> */}
				<SidebarMenuButton className={`h-full group-data-[collapsible=icon]:!p-0 md:py-3`}>
					<Avatar className={avatarClasses}>
						<AvatarImage src={community.avatar || undefined} />
						<AvatarFallback>{community.name[0]}</AvatarFallback>
					</Avatar>
					<div className={textClasses}>{community.name}</div>
					<ChevronDown className="ml-auto" />
				</SidebarMenuButton>
				{/* </div> */}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[--radix-popper-anchor-width] min-w-52">
				{availableCommunities
					.filter((option) => {
						return option?.slug !== community.slug;
					})
					.map((option) => {
						return (
							<DropdownMenuItem asChild key={option.id}>
								<Link
									href={`/c/${option.slug}/stages`}
									className="cursor-pointer hover:bg-gray-50"
								>
									<div className="flex items-center">
										<Avatar className={avatarClasses}>
											<AvatarImage src={option.avatar || undefined} />
											<AvatarFallback>{option.name[0]}</AvatarFallback>
										</Avatar>
										<div className={textClasses}>{option.name}</div>
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
