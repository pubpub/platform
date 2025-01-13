import { MemberRole } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
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

import type { CommunityData } from "~/lib/server/community";
import type { DefinitelyHas } from "~/lib/types";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";
import { NavLinkSubMenu } from "./NavLinkSubMenu";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

export type LinkDefinition = {
	href: string;
	text: string;
	icon: React.ReactNode;
	minimumAccessRole: MemberRole | null;
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
		minimumAccessRole: MemberRole.editor,
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
				minimumAccessRole: MemberRole.editor,
				pattern: "/stages/manage",
			},
		],
	},
	{
		href: "/types",
		text: "Types",
		icon: <ToyBrick size={16} />,
		minimumAccessRole: MemberRole.editor,
	},
	{
		href: "/fields",
		text: "Fields",
		icon: <FormInput size={16} />,
		minimumAccessRole: MemberRole.editor,
	},
	{
		href: "/forms",
		text: "Forms",
		icon: <Form size={16} />,
		minimumAccessRole: MemberRole.editor,
	},
	{
		href: "/integrations",
		text: "Integrations",
		icon: <Integration size={16} />,
		minimumAccessRole: MemberRole.editor,
	},
	{
		href: "/members",
		text: "Members",
		icon: <UsersRound size={16} />,
		minimumAccessRole: MemberRole.editor,
	},
	{
		href: "/settings",
		text: "Settings",
		icon: <Settings className="h-4 w-4" />,
		minimumAccessRole: MemberRole.editor,
		pattern: "/settings$",
		children: [
			{
				href: "/settings/tokens",
				text: "API Tokens",
				icon: <Settings className="h-4 w-4" />,
				minimumAccessRole: MemberRole.editor,
			},
		],
	},
];

export const COLLAPSIBLE_TYPE: Parameters<typeof Sidebar>[0]["collapsible"] = "icon";

const Links = ({
	communityPrefix,
	minimumCommunityRole,
	links,
}: {
	/* The community prefix, e.g. "/c/community-slug"
	 */
	communityPrefix: string;
	minimumCommunityRole: MemberRole;
	links: LinkDefinition[];
}) => {
	return (
		<>
			{links
				.filter((link) => {
					if (link.minimumAccessRole === null) {
						return true;
					}

					if (link.minimumAccessRole === MemberRole.editor) {
						return (
							minimumCommunityRole === MemberRole.editor ||
							minimumCommunityRole === MemberRole.admin
						);
					}

					if (link.minimumAccessRole === MemberRole.admin) {
						return minimumCommunityRole === MemberRole.admin;
					}

					return false;
				})
				.map((link) => {
					if (!link.children || link.children.length === 0) {
						return (
							<NavLink
								key={link.href}
								href={`${communityPrefix}${link.href}`}
								text={link.text}
								icon={link.icon}
								pattern={link.pattern}
							/>
						);
					}

					return (
						<NavLinkSubMenu
							link={link as DefinitelyHas<LinkDefinition, "children">}
							communityPrefix={communityPrefix}
							key={link.href}
						/>
					);
				})}
		</>
	);
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities }) {
	const prefix = `/c/${community.slug}`;

	const { user } = await getLoginData();

	if (!user) {
		return null;
	}

	const userCanEditCommunity = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		user.id
	);

	return (
		<Sidebar collapsible={COLLAPSIBLE_TYPE}>
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
									<Links
										communityPrefix={prefix}
										minimumCommunityRole={
											userCanEditCommunity
												? MemberRole.admin
												: MemberRole.editor
										}
										links={defaultLinks}
									/>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupLabel>Views</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<Links
										communityPrefix={prefix}
										minimumCommunityRole={
											userCanEditCommunity
												? MemberRole.admin
												: MemberRole.editor
										}
										links={viewLinks}
									/>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupLabel>Manage</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<Links
										communityPrefix={prefix}
										minimumCommunityRole={
											userCanEditCommunity
												? MemberRole.admin
												: MemberRole.editor
										}
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
