import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import { Settings } from "ui/icon";

import { getLoginData } from "~/lib/auth/loginData";
import LogoutButton from "../../components/LogoutButton";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className="w-max-[100%] flex flex-col gap-y-2 rounded-lg border border-gray-100 bg-white p-2">
			<div className="flex items-center">
				<Avatar className="mr-2 h-9 w-9">
					<Link className="w-full" href="/settings">
						<AvatarImage src={loginData.avatar || undefined} />
						<AvatarFallback>
							{(loginData.firstName || loginData.email)[0].toUpperCase()}
						</AvatarFallback>
					</Link>
				</Avatar>
				<div>
					<div className="text-xs">{loginData.firstName}</div>
					<div className="text-xs text-gray-400">{loginData.email}</div>
				</div>
			</div>
			<div className="mt-1 flex flex-row items-center">
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
