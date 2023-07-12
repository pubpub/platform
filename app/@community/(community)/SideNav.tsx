"use client";
import styles from "./SideNav.module.css";
import NavLink from "./NavLink";
import CommunitySwitcher from "./CommunitySwitcher";
import PinnedLink from "./PinnedLink";
import LoginSwitcher from "./LoginSwitcher";

import { CommunityData, PinsData } from "./layout";

type Props = { community: NonNullable<CommunityData>; pins: NonNullable<PinsData> };

const getTitle = (pub: Props["pins"][number]["pub"]) => {
	if (!pub) {
		return "";
	}
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

const SideNav: React.FC<Props> = function ({ community, pins }) {
	return (
		<div className={styles.side}>
			<div className={styles.links}>
				<CommunitySwitcher community={community} />
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
				{pins.map((pin) => {
					if (pin.pub) {
						return <PinnedLink text={getTitle(pin.pub)} href={`/pubs/${pin.pub.id}`} />;
					}
					if (pin.workflow) {
						return (
							<PinnedLink
								text={pin.workflow.name}
								href={`/workflows/${pin.workflow.id}`}
							/>
						);
					}
					if (pin.instance) {
						return (
							<PinnedLink
								text={pin.instance.name}
								href={`/integrations/${pin.instance.id}`}
							/>
						);
					}
				})}
			</div>
			<div>
				<LoginSwitcher />
			</div>
		</div>
	);
};

export default SideNav;
