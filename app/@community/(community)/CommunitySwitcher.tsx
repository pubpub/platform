"use client";
import styles from "./CommunitySwitcher.module.css";

import { CommunityData } from "./layout";

type Props = { community: NonNullable<CommunityData> };

const CommunitySwitcher: React.FC<Props> = function ({ community }) {
	return (
		<div className={styles.switcher}>
			<img className={styles.logo} src={community.avatar} />
			<div className={styles.text}>{community.name}</div>
			<img className={styles.icon} src="/icons/chevron-vertical.svg" />
		</div>
	);
};

export default CommunitySwitcher;
