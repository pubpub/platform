import type { Users } from "db/public";

import { UserAvatar } from "./UserAvatar";

type Props = {
	user: Pick<Users, "avatar" | "firstName" | "lastName" | "email">;
};

export const UserCard = (props: Props) => {
	return (
		<div className="flex items-center space-x-4">
			<UserAvatar user={props.user} />
			<div>
				<p className="text-sm font-medium leading-none">
					{props.user.firstName} {props.user.lastName}
				</p>
				<p className="text-sm text-muted-foreground">{props.user.email}</p>
			</div>
		</div>
	);
};
