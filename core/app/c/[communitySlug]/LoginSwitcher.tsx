import type { User } from "lucia"

import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { ChevronsUpDown, UserRoundCog } from "ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { Separator } from "ui/separator"
import { SidebarMenuButton } from "ui/sidebar"

import { getLoginData } from "~/lib/authentication/loginData"
import LogoutButton from "../../components/LogoutButton"

const AvatarThing = ({ user }: { user: User }) => (
	<div className="flex w-full items-center gap-x-2">
		<Avatar className="h-9 w-9 group-data-[collapsible=icon]:-ml-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
			<AvatarImage src={user.avatar || undefined} />
			<AvatarFallback>{(user.firstName || user.email)[0].toUpperCase()}</AvatarFallback>
		</Avatar>

		<div className="flex min-w-0 flex-grow flex-col justify-start text-start group-data-[collapsible=icon]:hidden">
			<p className="truncate text-sm">{user.firstName}</p>
			<p className="truncate text-xs text-gray-500">{user.email}</p>
		</div>
	</div>
)

export default async function LoginSwitcher() {
	const { user } = await getLoginData()
	if (!user) {
		return null
	}
	return (
		<div className="w-max-[100%] borderp-2 flex flex-col gap-y-2 rounded-lg">
			<Popover>
				<PopoverTrigger asChild>
					<SidebarMenuButton
						className="flex h-fit items-center gap-x-2 p-2 py-1"
						aria-label="User menu"
						data-testid="user-menu-button"
						aria-haspopup="true"
					>
						<AvatarThing user={user} />
						<ChevronsUpDown
							size="16"
							className="group-data-[collapsible=icon]:hidden"
						/>
					</SidebarMenuButton>
				</PopoverTrigger>
				<PopoverContent side="right" className="p-0">
					<div className="flex flex-col items-start">
						<div className="p-2">
							<AvatarThing user={user} />
						</div>
						<Separator className="mx-1" />
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="w-full justify-start gap-2 rounded-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<Link
								className="flex w-full items-center justify-start gap-2"
								href="/settings"
							>
								<UserRoundCog size="14" strokeWidth={1.5} />
								Settings
							</Link>
						</Button>
						<Separator className="mx-1" />
						<LogoutButton
							variant="ghost"
							className="w-full justify-start rounded-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
