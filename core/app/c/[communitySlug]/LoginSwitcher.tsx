import { getLoginData } from "@/core/lib/auth/loginData";
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/ui/src/Avatar";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className="bg-white border border-gray-100 rounded-lg flex p-2">
			<Avatar className="w-9 h-9 mr-2">
				<AvatarImage src={loginData.avatar || undefined} />
				<AvatarFallback>{loginData.name[0]}</AvatarFallback>
			</Avatar>
			<div className="flex-auto">
				<div className="text-xs">{loginData.name}</div>
				<div className="text-xs text-gray-400">{loginData.email}</div>
			</div>

			<div>
				<img className="mt-2" src="/icons/ellipsis.svg" />
			</div>
		</div>
	);
}
