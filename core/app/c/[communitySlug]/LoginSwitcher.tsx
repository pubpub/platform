import { getLoginData } from "~/lib/auth/loginData";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import LogoutButton from "../../components/LogoutButton";
import Link from "next/link";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className="bg-white border border-gray-100 rounded-lg flex flex-wrap p-2 w-max-[100%]">
			<div className="flex items-center">
				<Avatar className="w-9 h-9 mr-2">
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
			<div className="mt-1 flex flex-row items-">
				<LogoutButton />
				<Link className="ml-2" href="/settings">
					<Button variant="outline" size="sm">
						Settings
					</Button>
				</Link>
			</div>
		</div>
	);
}
