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
