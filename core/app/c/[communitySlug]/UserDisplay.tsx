import type { User } from "contracts"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"

export const UserDisplay = ({ user }: { user: User }) => (
	<div className="flex w-full items-center gap-x-2">
		<Avatar className="group-data-[collapsible=icon]:-ml-2 h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
			<AvatarImage src={user.avatar || undefined} />
			<AvatarFallback>
				{user.firstName[0]}
				{user.lastName?.[0] ?? ""}
			</AvatarFallback>
		</Avatar>

		<div className="flex min-w-0 grow flex-col justify-start text-start group-data-[collapsible=icon]:hidden">
			<p className="truncate text-sm">{user.firstName}</p>
			<p className="truncate text-muted-foreground text-xs">{user.email}</p>
		</div>
	</div>
)
