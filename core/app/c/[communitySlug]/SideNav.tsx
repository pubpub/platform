import { Capabilities, MemberRole, MembershipType } from "db/public";
import {
	Activity,
	Bookmark,
	BookOpen,
	BookOpenText,
	CurlyBraces,
	FlagTriangleRightIcon,
	Form,
	FormInput,
	Integration,
	Layers3,
	Pub,
	RefreshCw,
	Settings,
	Settings2,
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

export type LinkDefinition =
	| {
			href: string;
			text: string;
			icon: React.ReactNode;
			minimumAccessRole: MemberRole | null;
			pattern?: string;
			children?: LinkDefinition[];
	  }
	| {
			href?: string;
			text: string;
			icon: React.ReactNode;
			minimumAccessRole?: null;
			pattern?: string;
			children: Omit<LinkDefinition, "icon">[];
	  };

type LinkGroupDefinition = {
	name: string;
	minimumAccessRole: MemberRole;
	links: LinkDefinition[];
};

const viewLinks: LinkGroupDefinition = {
	name: "Views",
	minimumAccessRole: MemberRole.editor,
	links: [
		{
			href: "/pubs",
			text: "All Pubs",
			icon: <BookOpen size={16} />,
			minimumAccessRole: MemberRole.editor,
		},
		{
			href: "/stages",
			pattern: "/stages$",
			text: "All Workflows",
			icon: <FlagTriangleRightIcon size={16} />,
			minimumAccessRole: MemberRole.editor,
		},
		{
			href: "/activity/actions",
			text: "Action Log",
			icon: <Activity size={16} />,
			minimumAccessRole: MemberRole.editor,
		},
	],
};

const manageLinks: LinkGroupDefinition = {
	name: "Manage",
	minimumAccessRole: MemberRole.editor,
	links: [
		{
			href: "/stages/manage",
			text: "Workflows",
			icon: <Layers3 size={16} />,
			minimumAccessRole: MemberRole.editor,
			pattern: "/stages/manage",
		},
		{
			href: "/forms",
			text: "Forms",
			icon: <Form size={16} />,
			minimumAccessRole: MemberRole.editor,
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
			icon: <CurlyBraces size={16} />,
			minimumAccessRole: MemberRole.editor,
		},
		{
			href: "/members",
			text: "Members",
			icon: <UsersRound size={16} />,
			minimumAccessRole: MemberRole.editor,
		},
	],
};

const adminLinks: LinkGroupDefinition = {
	name: "Admin",
	minimumAccessRole: MemberRole.admin,
	links: [
		{
			text: "Settings",
			icon: <Settings2 size={16} />,
			minimumAccessRole: MemberRole.admin,
			children: [
				{
					href: "/settings/tokens",
					text: "API Tokens",
					minimumAccessRole: MemberRole.admin,
				},
			],
		},
		{
			text: "Docs",
			icon: <BookOpenText size={16} />,
			minimumAccessRole: MemberRole.admin,
			children: [
				{
					href: "/developers/docs",
					text: "API",
					minimumAccessRole: MemberRole.admin,
				},
			],
		},
	],
};

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

const LinkGroup = ({
	communityPrefix,
	minimumCommunityRole,
	group,
}: {
	communityPrefix: string;
	minimumCommunityRole: MemberRole;
	group: LinkGroupDefinition;
}) => {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="font-semibold uppercase text-slate-500">
				{group.name}
			</SidebarGroupLabel>
			<SidebarGroupContent className="group-data-[state=expanded]:px-2">
				<Links
					communityPrefix={communityPrefix}
					minimumCommunityRole={minimumCommunityRole}
					links={group.links}
				/>
			</SidebarGroupContent>
		</SidebarGroup>
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
						<LinkGroup
							communityPrefix={prefix}
							minimumCommunityRole={
								userCanEditCommunity ? MemberRole.admin : MemberRole.editor
							}
							group={viewLinks}
						/>
						<LinkGroup
							communityPrefix={prefix}
							minimumCommunityRole={
								userCanEditCommunity ? MemberRole.admin : MemberRole.editor
							}
							group={manageLinks}
						/>
						<LinkGroup
							communityPrefix={prefix}
							minimumCommunityRole={
								userCanEditCommunity ? MemberRole.admin : MemberRole.editor
							}
							group={adminLinks}
						/>
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
