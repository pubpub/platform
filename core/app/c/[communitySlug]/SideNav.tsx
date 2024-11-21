import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";
import { Activity, FormInput, Menu, RefreshCw, Settings, ToyBrick } from "ui/icon";
import { Sheet, SheetContent, SheetTrigger } from "ui/sheet";

import type { AvailableCommunitiesData, CommunityData } from "~/lib/server/community";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";
import NavLink from "./NavLink";

type Props = {
	community: NonNullable<CommunityData>;
	availableCommunities: NonNullable<AvailableCommunitiesData>;
};

const Links = ({
	communityPrefix,
}: {
	/* The community prefix, e.g. "/c/community-slug"
	 */
	communityPrefix: string;
}) => {
	return (
		<>
			<NavLink
				href={`${communityPrefix}/pubs`}
				text={"All Pubs"}
				icon={<img src="/icons/pub.svg" alt="" />}
			/>
		</>
	);
};

const ViewLinks = ({
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
			{isAdmin && (
				<NavLink
					href={`${prefix}/activity/actions`}
					text="Action Log"
					icon={<Activity className="h-4 w-4" />}
				/>
			)}
		</>
	);
};

const ManageLinks = ({
	communityPrefix,
	showCommunityEditorLinks: renderCommunityEditorLinks,
}: {
	/* The community prefix, e.g. "/c/community-slug"
	 */
	communityPrefix: string;
	/* Whether the user is an admin */
	showCommunityEditorLinks?: boolean;
}) => {
	return (
		<>
			<NavLink
				href={`${communityPrefix}/stages`}
				text={"Workflows"}
				icon={<img src="/icons/stages.svg" alt="" />}
			/>
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/stages/manage`}
					text="Stage editor"
					icon={<RefreshCw size={16} />}
				/>
			)}
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/types`}
					text="Types"
					icon={<ToyBrick size={16} />}
				/>
			)}
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/fields`}
					text="Fields"
					icon={<FormInput size={16} />}
				/>
			)}
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/forms`}
					text="Forms"
					icon={<img src="/icons/form.svg" alt="" />}
				/>
			)}
			<NavLink
				href={`${communityPrefix}/integrations`}
				text="Integrations"
				icon={<img src="/icons/integration.svg" alt="" />}
			/>
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/members`}
					text="Members"
					icon={<img src="/icons/members.svg" alt="" />}
				/>
			)}
			{renderCommunityEditorLinks && (
				<NavLink
					href={`${communityPrefix}/settings`}
					text="Settings"
					icon={<Settings className="h-4 w-4" />}
				/>
			)}
		</>
	);
};

const SideNav: React.FC<Props> = async function ({ community, availableCommunities }) {
	const prefix = `/c/${community.slug}`;
	const divider = <div className="my-4 h-[1px] bg-gray-200" />;

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
							<Links communityPrefix={prefix} />
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
							<nav className="grid items-start pr-2 pt-2 text-sm font-medium">
								<Links communityPrefix={prefix} />
								{divider}
								<span className="font-semibold text-gray-500">VIEWS</span>
								<ViewLinks prefix={prefix} isAdmin={userCanEditCommunity} />
							</nav>
							<nav className="grid items-start pr-2 pt-4 text-sm font-medium">
								<span className="font-semibold text-gray-500">MANAGE</span>
								<ManageLinks
									communityPrefix={prefix}
									showCommunityEditorLinks={userCanEditCommunity}
								/>
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
