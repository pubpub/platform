import Link from "next/link";

import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Menu } from "ui/icon";
import { Sheet, SheetContent, SheetTrigger } from "ui/sheet";

import { getLoginData } from "~/lib/auth/loginData";
import CommunitySwitcher from "./CommunitySwitcher";
import { CommunityData } from "./layout";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities }) {
	const prefix = `/c/${community.slug}`;
	const divider = <div className="my-4 h-[1px] bg-gray-200" />;

	const loginData = await getLoginData();
	const isAdmin = loginData?.memberships.find(
		(m) => m.community.slug === community.slug
	)?.canAdmin;

	return (
		<div className={"fixed flex h-screen w-[250px] flex-col bg-gray-50 p-4 shadow-inner"}>
			<div className="flex-auto">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" size="icon" className="shrink-0 md:hidden">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle navigation menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="flex flex-col">
						<nav className="grid gap-2 text-lg font-medium">
							<CommunitySwitcher
								community={community}
								availableCommunities={availableCommunities}
							/>
							<Link
								href="#"
								className="flex items-center gap-2 text-lg font-semibold"
							>
								{/* <Package2 className="h-6 w-6" /> */}
								<span className="sr-only">Acme Inc</span>
							</Link>
							<Link
								href="#"
								className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
							>
								{/* <Home className="h-5 w-5" /> */}
								Dashboard
							</Link>
							<Link
								href="#"
								className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
							>
								{/* <ShoppingCart className="h-5 w-5" /> */}
								Orders
								<Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
									6
								</Badge>
							</Link>
							<Link
								href="#"
								className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
							>
								{/* <Package className="h-5 w-5" /> */}
								Products
							</Link>
							<Link
								href="#"
								className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
							>
								{/* <Users className="h-5 w-5" /> */}
								Customers
							</Link>
							<Link
								href="#"
								className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
							>
								{/* <LineChart className="h-5 w-5" /> */}
								Analytics
							</Link>
						</nav>
						<div className="mt-auto">
							<Card>
								<CardHeader>
									<CardTitle>Upgrade to Pro</CardTitle>
									<CardDescription>
										Unlock all features and get unlimited access to our support
										team.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Button size="sm" className="w-full">
										Upgrade
									</Button>
								</CardContent>
							</Card>
						</div>
					</SheetContent>
				</Sheet>
				<CommunitySwitcher
					community={community}
					availableCommunities={availableCommunities}
				/>
				{/* <NavLink
					href={`${prefix}/search`}
					text={"Search"}
					icon={<img src="/icons/search.svg" />}
				/>
				<NavLink
					href={`${prefix}/`}
					text={"Dashboard"}
					icon={<img src="/icons/dashboard.svg" />}
					count={8}
				/> */}
				{divider}
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex-1">
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							<NavLink
								href={`${prefix}/pubs`}
								text={"Pubs"}
								icon={<img src="/icons/pub.svg" alt="" />}
							/>
							<NavLink
								href={`${prefix}/stages`}
								text={"Stages"}
								icon={<img src="/icons/stages.svg" alt="" />}
							/>
							<NavLink
								href={`${prefix}/integrations`}
								text={"Integrations"}
								icon={<img src="/icons/integration.svg" alt="" />}
							/>
							{isAdmin && (
								<NavLink
									href={`${prefix}/members`}
									text={"Members"}
									icon={<img src="/icons/members.svg" alt="" />}
								/>
							)}
						</nav>
					</div>
				</div>
				{/*<NavLink
					href={`${prefix}/types`}
					text={"Pub Types"}
					icon={<img src="" />}
				/>
				<NavLink
					href={`${prefix}/members`}
					text={"Members"}
					icon={<img src="/icons/members.svg" />}
				/>
				<NavLink
					href={`${prefix}/settings`}
					text={"Settings"}
					icon={<img src="/icons/settings.svg" />}
				/>
				{divider}
				<NavLink
					href={`${prefix}/recent-items`}
					text="Recent Items"
					icon={<img src="/icons/pin.svg" />}
				/> */}
			</div>
			<div>
				<LoginSwitcher />
			</div>
		</div>
	);
};

export default SideNav;
