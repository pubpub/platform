import { getLoginData } from "~/lib/auth/loginData";
import { Avatar, AvatarFallback, AvatarImage } from "ui";
import LogoutButton from "./LogoutButton";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className="bg-white border border-gray-100 rounded-lg flex p-2">
			<Avatar className="w-9 h-9 mr-2">
				<AvatarImage src={loginData.avatar || undefined} />
				<AvatarFallback>{loginData.firstName[0]}</AvatarFallback>
			</Avatar>
			<div className="flex-auto">
				<div className="text-xs">{loginData.firstName}</div>
				<div className="text-xs text-gray-400">{loginData.email}</div>
			</div>
			<LogoutButton />
			<div>
				<img className="mt-2" src="/icons/ellipsis.svg" />
			</div>
		</div>
	);
}
