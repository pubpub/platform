import { Users } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

type Props = {
	user: Pick<Users, "avatar" | "firstName" | "lastName">;
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
