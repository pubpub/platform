import { getLoginData } from "~/lib/auth/loginData";
import { Avatar, AvatarFallback, AvatarImage } from "ui";
import LogoutButton from "../../components/LogoutButton";
import Link from "next/link";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className="bg-white border border-gray-100 rounded-lg flex p-2 w-max-[100%]">
			<Avatar className="w-9 h-9 mr-2">
				<Link href="/settings">
					<AvatarImage src={loginData.avatar || undefined} />
					<AvatarFallback>{loginData.firstName[0]}</AvatarFallback>
				</Link>
			</Avatar>
			<div>
				<div className="text-xs">{loginData.firstName}</div>
				<div className="text-xs text-gray-400">{loginData.email}</div>
			</div>
			<LogoutButton />
		</div>
	);
}
