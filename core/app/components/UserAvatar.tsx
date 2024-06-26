import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import { Users } from "~/kysely/types/public/Users";

type Props = {
	user: Users;
};

export const UserAvatar = ({ user }: Props) => {
	return (
		<Avatar className="h-7 w-7">
			<AvatarImage
				src={user.avatar ?? undefined}
				alt={`${user.firstName} ${user.lastName}`}
			/>
			<AvatarFallback>
				{user.firstName[0]}
				{user.lastName?.[0] ?? ""}
			</AvatarFallback>
		</Avatar>
	);
};
