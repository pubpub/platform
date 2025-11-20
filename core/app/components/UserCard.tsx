import type { Users } from "db/public"

import { UserAvatar } from "./UserAvatar"

type Props = {
	user: Pick<Users, "avatar" | "firstName" | "lastName" | "email">
}

export const UserCard = (props: Props) => {
	return (
		<div className="flex items-center space-x-4">
			<UserAvatar user={props.user} />
			<div>
				<p className="font-medium text-sm leading-none">
					{props.user.firstName} {props.user.lastName}
				</p>
				<p className="text-muted-foreground text-sm">{props.user.email}</p>
			</div>
		</div>
	)
}
