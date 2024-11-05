import {
	Activity,
	Form,
	FormInput,
	Integration,
	Pub,
	RefreshCw,
	Settings,
	Stages,
	ToyBrick,
	UsersRound,
} from "ui/icon";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
} from "ui/sidebar";

import type { AvailableCommunitiesData, CommunityData } from "~/lib/server/community";
import type { DefinitelyHas } from "~/lib/types";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";
import { NavLinkSubMenu } from "./NavLinkSubMenu";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<AvailableCommunitiesData>;
	collapsible?: Parameters<typeof Sidebar>[0]["collapsible"];
};

export type LinkDefinition = {
	href: string;
	text: string;
	icon: React.ReactNode;
	minimumAccessRole: "superadmin" | "admin" | null;
	pattern?: string;
	children?: LinkDefinition[];
};

const defaultLinks: LinkDefinition[] = [
	{
		href: "/pubs",
		text: "All Pubs",
		icon: <Pub size={16} />,
		minimumAccessRole: null,
	},
];

const viewLinks: LinkDefinition[] = [
	{
		href: "/activity/actions",
		text: "Action Log",
		icon: <Activity className="h-4 w-4" />,
		minimumAccessRole: "admin",
	},
];

const manageLinks: LinkDefinition[] = [
	{
		href: "/stages",
		text: "Workflows",
		icon: <Stages size={16} />,
		minimumAccessRole: null,
		pattern: "/stages$",
		children: [
			{
				href: "/stages/manage",
				text: "Stage editor",
				icon: <RefreshCw size={16} />,
				minimumAccessRole: "admin",
				pattern: "/stages/manage",
			},
		],
	},
	{
		href: "/types",
		text: "Types",
		icon: <ToyBrick size={16} />,
		minimumAccessRole: "admin",
	},
	{
		href: "/fields",
		text: "Fields",
		icon: <FormInput size={16} />,
		minimumAccessRole: "admin",
	},
	{
		href: "/forms",
		text: "Forms",
		icon: <Form size={16} />,
		minimumAccessRole: "admin",
	},
	{
		href: "/integrations",
		text: "Integrations",
		icon: <Integration size={16} />,
		minimumAccessRole: "admin",
	},
	{
		href: "/members",
		text: "Members",
		icon: <UsersRound size={16} />,
		minimumAccessRole: "admin",
	},
	{
		href: "/settings",
		text: "Settings",
		icon: <Settings className="h-4 w-4" />,
		minimumAccessRole: "superadmin",
		pattern: "/settings$",
		children: [
			{
				href: "/settings/tokens",
				text: "API Tokens",
				icon: <Settings className="h-4 w-4" />,
				minimumAccessRole: "superadmin",
			},
		],
	},
];

const Links = ({
	prefix,
	isAdmin,
	isSuperAdmin,
	links,
}: {
	/* The community prefix, e.g. "/c/community-slug"
	 */
	prefix: string;
	/* Whether the user is an admin */
	isAdmin?: boolean;
	/**
	 * Whether the user is a super admin
	 */
	isSuperAdmin?: boolean;
	links: LinkDefinition[];
}) => {
	return (
		<>
			{links
				.filter((link) => {
					if (link.minimumAccessRole === null) {
						return true;
					}

					if (link.minimumAccessRole === "admin") {
						return isSuperAdmin || isAdmin;
					}

					if (link.minimumAccessRole === "superadmin") {
						return isSuperAdmin;
					}

					return false;
				})
				.map((link) => {
					if (!link.children || link.children.length === 0) {
						return (
							<NavLink
								key={link.href}
								href={`${prefix}${link.href}`}
								text={link.text}
								icon={link.icon}
								pattern={link.pattern}
							/>
						);
					}

					return (
						<NavLinkSubMenu
							link={link as DefinitelyHas<LinkDefinition, "children">}
							prefix={prefix}
							key={link.href}
						/>
					);
				})}
		</>
	);
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities, collapsible }) {
	const prefix = `/c/${community.slug}`;

	const { user } = await getLoginData();

	const isAdmin = isCommunityAdmin(user, community);

	const isSuperAdmin = user?.isSuperAdmin;

	return (
		<Sidebar collapsible={collapsible}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className={`h-full`}>
						<CommunitySwitcher
							community={community}
							availableCommunities={availableCommunities}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarSeparator />
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex-1">
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									<Links prefix={prefix} isAdmin={isAdmin} links={defaultLinks} />
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupLabel>Views</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<Links prefix={prefix} isAdmin={isAdmin} links={viewLinks} />
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupLabel>Manage</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<Links
										prefix={prefix}
										isAdmin={isAdmin}
										isSuperAdmin={isSuperAdmin}
										links={manageLinks}
									/>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</div>
				</div>
			</SidebarContent>
			<SidebarFooter>
				<LoginSwitcher />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
};

export default SideNav;
