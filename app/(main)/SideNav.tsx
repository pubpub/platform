"use client";
import styles from "./SideNav.module.css";
import NavLink from "./NavLink";
import CommunitySwitcher from "./CommunitySwitcher";
import PinnedLink from "./PinnedLink";
import LoginSwitcher from "./LoginSwitcher";

export default function SideNav() {
	return (
		<div className={styles.side}>
			<div className={styles.links}>
				<CommunitySwitcher />
				<NavLink href="/search" text={"Search"} icon={<img src="/icons/search.svg" />} />
				<NavLink
					href="/"
					text={"Dashboard"}
					icon={<img src="/icons/dashboard.svg" />}
					count={8}
				/>
				<div className={styles.divider} />
				<NavLink href="/pubs" text={"Pubs"} icon={<img src="/icons/pub.svg" />} />
				<NavLink
					href="/workflows"
					text={"Workflows"}
					icon={<img src="/icons/workflow.svg" />}
				/>
				<NavLink
					href="/integrations"
					text={"Integrations"}
					icon={<img src="/icons/integration.svg" />}
				/>
				<NavLink href="/members" text={"Members"} icon={<img src="/icons/members.svg" />} />
				<NavLink
					href="/settings"
					text={"Settings"}
					icon={<img src="/icons/settings.svg" />}
				/>
				<div className={styles.divider} />
				<NavLink href="" text={"Pinned Items"} icon={<img src="/icons/pin.svg" />} />
				<PinnedLink text="Harvard Data Science Review" href="/pubs/hdsr" />
				<PinnedLink text="Frankenbook" href="/pubs/frankenbook" />
				<PinnedLink text="Journal Peer Review" href="/workflows/journal-asd12" />
			</div>
			<div>
				<LoginSwitcher />
			</div>
		</div>
	);
}
