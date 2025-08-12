import type { User } from "lucia";

import { cache, Suspense } from "react";

import type { Communities, CommunitiesId, UsersId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import {
	Activity,
	BookOpen,
	BookOpenText,
	CurlyBraces,
	FlagTriangleRightIcon,
	Form,
	Layers3,
	Settings2,
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
	SidebarMenuSkeleton,
	SidebarMenuSubItem,
	SidebarRail,
	SidebarSeparator,
} from "ui/sidebar";

import type { CommunityData } from "~/lib/server/community";
import type { MaybeHas } from "~/lib/types";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan, userCanViewStagePage } from "~/lib/authorization/capabilities";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";
import { NavLinkSubMenu } from "./NavLinkSubMenu";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<CommunityData>[];
};

type BaseLinkDefinition = {
	href: string;
	text: string;
	authorization: null | ((userId: UsersId, communityId: CommunitiesId) => Promise<boolean>);
	pattern?: string;
};

type SubMenuLinkDefinition = MaybeHas<BaseLinkDefinition, "href"> & {
	children: SubLevelLinkDefinition[] | SubMenuLinkDefinition[];
	icon: React.ReactNode;
};

type TopLevelLinkDefinition = BaseLinkDefinition & {
	icon: React.ReactNode;
};

type SubLevelLinkDefinition = BaseLinkDefinition & {
	icon?: React.ReactNode;
};

export type LinkDefinition =
	| TopLevelLinkDefinition
	| SubMenuLinkDefinition
	| SubLevelLinkDefinition;

type LinkGroupDefinition = {
	name: string;
	authorization: null | ((userId: UsersId, communityId: CommunitiesId) => Promise<boolean>);
	links: LinkDefinition[];
};

const userCanEditCommunityCached = cache(async (userId: UsersId, communityId: CommunitiesId) => {
	return await userCan(
		Capabilities.editCommunity,
		{
			type: MembershipType.community,
			communityId,
		},
		userId
	);
});

const viewLinks: LinkGroupDefinition = {
	name: "Views",
	authorization: null,
	links: [
		{
			href: "/pubs",
			text: "All Pubs",
			icon: <BookOpen size={16} />,
			authorization: null,
		},
		{
			href: "/stages",
			pattern: "/stages$",
			text: "All Workflows",
			icon: <FlagTriangleRightIcon size={16} />,
			authorization: userCanViewStagePage,
		},
		{
			href: "/activity/actions",
			text: "Action Log",
			icon: <Activity size={16} />,
			authorization: userCanEditCommunityCached,
		},
	],
};

const manageLinks: LinkGroupDefinition = {
	name: "Manage",
	authorization: userCanEditCommunityCached,
	links: [
		{
			href: "/stages/manage",
			text: "Workflows",
			icon: <Layers3 size={16} />,
			pattern: "/stages/manage",
			authorization: userCanEditCommunityCached,
		},
		{
			href: "/forms",
			text: "Forms",
			icon: <Form size={16} />,
			authorization: userCanEditCommunityCached,
		},
		{
			href: "/types",
			text: "Types",
			icon: <ToyBrick size={16} />,
			authorization: userCanEditCommunityCached,
		},
		{
			href: "/fields",
			text: "Fields",
			icon: <CurlyBraces size={16} />,
			authorization: userCanEditCommunityCached,
		},
		{
			href: "/members",
			text: "Members",
			icon: <UsersRound size={16} />,
			authorization: userCanEditCommunityCached,
		},
	],
};

const adminLinks: LinkGroupDefinition = {
	name: "Admin",
	authorization: userCanEditCommunityCached,
	links: [
		{
			text: "Settings",
			icon: <Settings2 size={16} />,
			authorization: userCanEditCommunityCached,
			children: [
				{
					href: "/settings/tokens",
					text: "API Tokens",
					authorization: userCanEditCommunityCached,
				},
				{
					href: "/settings/actions",
					text: "Actions",
					authorization: userCanEditCommunityCached,
				},
			],
		},
		{
			text: "Docs",
			icon: <BookOpenText size={16} />,
			authorization: userCanEditCommunityCached,
			children: [
				{
					href: "/developers/docs",
					text: "API",
					authorization: userCanEditCommunityCached,
				},
			],
		},
	],
};

export const COLLAPSIBLE_TYPE: Parameters<typeof Sidebar>[0]["collapsible"] = "icon";

const Links = ({
	user,
	community,
	links,
	groupName,
}: {
	user: User;
	community: Communities;
	links: LinkDefinition[];
	groupName?: string;
}) => {
	return (
		<>
			{links.map((link) => {
				if (!("children" in link)) {
					return (
						<Suspense fallback={<SidebarMenuSkeleton />} key={link.href || link.text}>
							<Link
								user={user}
								community={community}
								link={link}
								groupName={groupName}
							/>
						</Suspense>
					);
				}

				return (
					<SubMenuLinks user={user} community={community} link={link} key={link.text} />
				);
			})}
		</>
	);
};

const Link = async ({
	user,
	community,
	link,
	groupName,
}: {
	user: User;
	community: Communities;
	link: TopLevelLinkDefinition | SubLevelLinkDefinition;
	groupName?: string;
}) => {
	if (link.authorization) {
		const userCan = await link.authorization(user.id, community.id);

		if (!userCan) {
			return null;
		}
	}

	return (
		<NavLink
			href={`/c/${community.slug}${link.href}`}
			text={link.text}
			icon={link.icon}
			pattern={link.pattern}
			groupName={groupName}
			hasChildren
			isChild={false}
		/>
	);
};

const SubMenuLinks = async ({
	user,
	community,
	link,
}: {
	user: User;
	community: Communities;
	link: SubMenuLinkDefinition;
}) => {
	if (link.authorization) {
		const userCan = await link.authorization(user.id, community.id);

		if (!userCan) {
			return null;
		}
	}

	return (
		<NavLinkSubMenu
			icon={link.icon}
			text={link.text}
			parentLink={
				link.href ? (
					<NavLink
						href={`/c/${community.slug}${link.href}`}
						text={link.text}
						icon={link.icon}
						pattern={link.pattern}
						hasChildren
						isChild={false}
					/>
				) : null
			}
		>
			{link.children.map((child) => (
				<SidebarMenuSubItem key={child.href}>
					<Links user={user} community={community} links={link.children} />
				</SidebarMenuSubItem>
			))}
		</NavLinkSubMenu>
	);
};

const LinkGroup = async ({
	user,
	community,
	group,
}: {
	user: User;
	community: Communities;
	group: LinkGroupDefinition;
}) => {
	if (group.authorization) {
		const userCan = await group.authorization(user.id, community.id);

		if (!userCan) {
			return null;
		}
	}

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:py-0">
			<SidebarGroupLabel className="font-semibold uppercase text-gray-500 group-data-[collapsible=icon]:hidden">
				{group.name}
			</SidebarGroupLabel>
			<SidebarGroupContent className="group-data-[state=expanded]:px-2">
				<Links
					user={user}
					community={community}
					links={group.links}
					groupName={group.name}
				/>
			</SidebarGroupContent>
		</SidebarGroup>
	);
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities }) {
	const { user } = await getLoginData();

	if (!user) {
		return null;
	}

	return (
		<Sidebar collapsible={COLLAPSIBLE_TYPE}>
			<SidebarHeader className="py-4 group-data-[state=expanded]:p-2 group-data-[collapsible=icon]:pt-5">
				<SidebarMenu>
					<SidebarMenuItem className={`h-full`}>
						<CommunitySwitcher
							community={community}
							availableCommunities={availableCommunities}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarSeparator className="group-data-[state=expanded]:mx-3 group-data-[collapsible=icon]:mt-3" />
			</SidebarHeader>
			<SidebarContent className="group-data-[state=expanded]:px-1 group-data-[state=expanded]:py-3">
				<div className="flex h-full max-h-screen flex-col group-data-[state=expanded]:gap-2">
					<div className="flex-1">
						<LinkGroup user={user} community={community} group={viewLinks} />
						<LinkGroup user={user} community={community} group={manageLinks} />
						<LinkGroup user={user} community={community} group={adminLinks} />
					</div>
				</div>
			</SidebarContent>
			<SidebarFooter className="px-2 pb-4">
				<SidebarMenu>
					<SidebarMenuItem>
						<LoginSwitcher />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
};

export default SideNav;
