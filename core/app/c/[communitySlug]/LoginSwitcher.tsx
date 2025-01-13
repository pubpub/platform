import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import { Settings } from "ui/icon";

import { getLoginData } from "~/lib/authentication/loginData";
import LogoutButton from "../../components/LogoutButton";

export default async function LoginSwitcher() {
	const { user } = await getLoginData();
	if (!user) {
		return null;
	}
	return (
		<div className="w-max-[100%] flex flex-col gap-y-2 rounded-lg border border-gray-100 bg-white p-2 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
			<div className="flex items-center">
				<Avatar className="mr-2 h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
					<Link className="w-full" href="/settings">
						<AvatarImage src={user.avatar || undefined} />
						<AvatarFallback>
							{(user.firstName || user.email)[0].toUpperCase()}
						</AvatarFallback>
					</Link>
				</Avatar>
				<div className="group-data-[collapsible=icon]:hidden">
					<div className="text-xs">{user.firstName}</div>
					<div className="text-xs text-gray-400">{user.email}</div>
				</div>
			</div>
			<div className="mt-1 flex flex-row items-center group-data-[collapsible=icon]:hidden">
				<LogoutButton />
				<Button variant="outline" size="sm" asChild>
					<Link className="ml-2 flex items-center gap-1" href="/settings">
						<Settings size="14" />
						Settings
					</Link>
				</Button>
			</div>
		</div>
	);
}
