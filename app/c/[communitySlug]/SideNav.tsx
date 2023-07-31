import styles from "./SideNav.module.css";
import NavLink from "./NavLink";
import CommunitySwitcher from "./CommunitySwitcher";
import LoginSwitcher from "./LoginSwitcher";

import { CommunityData } from "./layout";

type Props = { community: NonNullable<CommunityData>, availableCommunities: CommunityData[] };


const SideNav: React.FC<Props> = function ({ community, availableCommunities }) {
	const prefix = `/c/${community.slug}`;
	return (
		<div className={styles.side}>
			<div className={styles.links}>
				<CommunitySwitcher community={community} availableCommunities={availableCommunities} />
				<NavLink href={`${prefix}/search`} text={"Search"} icon={<img src="/icons/search.svg" />} />
				<NavLink
					href="/"
					text={"Dashboard"}
					icon={<img src="/icons/dashboard.svg" />}
					count={8}
				/>
				<div className={styles.divider} />
				<NavLink href={`${prefix}/pubs`} text={"Pubs"} icon={<img src="/icons/pub.svg" />} />
				<NavLink
					href={`${prefix}/stages`}
					text={"Stages"}
					icon={<img src="/icons/stages.svg" />}
				/>
				<NavLink
					href={`${prefix}/integrations`}
					text={"Integrations"}
					icon={<img src="/icons/integration.svg" />}
				/>
				<NavLink href={`${prefix}/members`} text={"Members"} icon={<img src="/icons/members.svg" />} />
				<NavLink
					href={`${prefix}/settings`}
					text={"Settings"}
					icon={<img src="/icons/settings.svg" />}
				/>
				<div className={styles.divider} />
				<NavLink href="" text={"Recent Items"} icon={<img src="/icons/pin.svg" />} />
			</div>
			<div>
				<LoginSwitcher />
			</div>
		</div>
	);
};

export default SideNav;
