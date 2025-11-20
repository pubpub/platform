import type { Users } from "db/public"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

type Props = {
	user: Pick<Users, "avatar" | "firstName" | "lastName">
}

export const UserAvatar = ({ user }: Props) => {
	return (
		<Avatar className="h-7 w-7">
			<Tooltip>
				<TooltipTrigger asChild>
					<AvatarImage
						src={user.avatar ?? undefined}
						alt={`${user.firstName} ${user.lastName}`}
					/>
				</TooltipTrigger>
				<TooltipContent className="max-w-xs text-xs">
					{user.firstName} {user.lastName}
				</TooltipContent>
			</Tooltip>
			<AvatarFallback>
				{user.firstName[0]}
				{user.lastName?.[0] ?? ""}
			</AvatarFallback>
		</Avatar>
	)
}
