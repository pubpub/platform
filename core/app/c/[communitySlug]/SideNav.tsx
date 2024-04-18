import { Button } from "ui/button";
import { Menu } from "ui/icon";
import { Sheet, SheetContent, SheetTrigger } from "ui/sheet";

import type { CommunityData } from "./layout";
import { getLoginData } from "~/lib/auth/loginData";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

const Links = ({
	prefix,
	isAdmin,
}: {
	/* The community prefix, e.g. "/c/community-slug"
	 */
	prefix: string;
	/* Whether the user is an admin */
	isAdmin?: boolean;
}) => {
	return (
		<>
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
		</>
	);
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities }) {
	const prefix = `/c/${community.slug}`;
	const divider = <div className="my-4 h-[1px] bg-gray-200" />;

	const loginData = await getLoginData();
	const isAdmin = loginData?.memberships.find(
		(m) => m.community.slug === community.slug
	)?.canAdmin;

	return (
		<>
			<header className="flex h-14 w-full items-center justify-between gap-4 border-b px-4 md:hidden lg:h-[60px] lg:px-6">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" size="icon" className="shrink-0">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle navigation menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="mr-4 flex flex-col justify-between bg-gray-50 pb-8"
					>
						<nav className="grid gap-2 pr-6 text-lg font-medium">
							<Links prefix={prefix} isAdmin={isAdmin} />
						</nav>
						<div>
							<LoginSwitcher />
						</div>
					</SheetContent>
				</Sheet>
				<CommunitySwitcher
					community={community}
					availableCommunities={availableCommunities}
				/>
			</header>
			<div
				className={
					"fixed hidden h-screen w-[250px] flex-col bg-gray-50 p-4 shadow-inner md:flex"
				}
			>
				<div className="flex-auto">
					<CommunitySwitcher
						community={community}
						availableCommunities={availableCommunities}
					/>
					{divider}
					<div className="flex h-full max-h-screen flex-col gap-2">
						<div className="flex-1">
							<nav className="grid items-start pr-2 text-sm font-medium">
								<Links prefix={prefix} isAdmin={isAdmin} />
							</nav>
						</div>
					</div>
				</div>
				<div>
					<LoginSwitcher />
				</div>
			</div>
		</>
	);
};

export default SideNav;
