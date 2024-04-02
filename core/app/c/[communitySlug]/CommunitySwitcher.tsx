import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";

import { CommunityData } from "./layout";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

const CommunitySwitcher: React.FC<Props> = function ({ community, availableCommunities }) {
	const avatarClasses = "rounded w-9 h-9 mr-2";
	const textClasses = "flex-auto text-base font-bold w-44 text-left";
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="-m-2 mb-10 flex cursor-pointer items-center rounded p-2 hover:bg-gray-200">
					<Avatar className={avatarClasses}>
						<AvatarImage src={community.avatar || undefined} />
						<AvatarFallback>{community.name[0]}</AvatarFallback>
					</Avatar>
					<div className={textClasses}>{community.name}</div>
					<img className="" src="/icons/chevron-vertical.svg" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent className=" w-56 bg-white">
				{availableCommunities
					.filter((option) => {
						return option?.slug !== community.slug;
					})
					.map((option) => {
						return (
							<DropdownMenuItem asChild key={option.id}>
								<Link
									href={`/c/${option.slug}`}
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
