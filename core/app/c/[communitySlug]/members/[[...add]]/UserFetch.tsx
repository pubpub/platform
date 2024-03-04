import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Icon } from "ui";
import { getSuggestedMembers } from "~/lib/server";
import * as actions from "./actions";

export async function UserFetch({ email }: { email: string }) {
	console.log("fetching users for ", email);
	console.log("running in the ", typeof window === "undefined" ? "server" : "client");
	const users = await getSuggestedMembers(email);

	if (!users.length) {
		return null;
	}
	const user = users[0];

	return (
		<Card>
			<CardContent className="flex items-center justify-between p-4">
				<div className="flex gap-x-4 items-center">
					<Avatar>
						<AvatarImage
							src={user.avatar ?? undefined}
							alt={`${user.firstName} ${user.lastName}`}
						/>
						<AvatarFallback>
							{user.firstName[0]}
							{user?.lastName?.[0] ?? ""}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-y-1">
						<span>
							{user.firstName} {user.lastName}
						</span>
						<span className="text-xs">{email}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
