"use client";
import { Dropdown } from "flowbite-react";
import Link from "next/link";
import styles from "./CommunitySwitcher.module.css";

import { CommunityData } from "./layout";

type Props = { community: NonNullable<CommunityData>; availableCommunities: CommunityData[] };

const CommunitySwitcher: React.FC<Props> = function ({ community, availableCommunities }) {
	return (
		<Dropdown
			arrowIcon={false}
			fullSized={true}
			inline
			label={
				<div className={styles.switcher}>
					<img className={styles.logo} src={community.avatar} />
					<div className={styles.text}>{community.name}</div>
					<img className={styles.icon} src="/icons/chevron-vertical.svg" />
				</div>
			}
		>
			{availableCommunities
				.filter((option) => {
					return option?.slug !== community.slug;
				})
				.map((option) => {
					return (
						<Dropdown.Item as={Link} href={`/c/${option?.slug}`}>
							<div className="flex items-center">
								<img className={styles.logo} src={option.avatar} />
								<div className={styles.text}>{option.name}</div>
							</div>
						</Dropdown.Item>
					);
				})}
		</Dropdown>
	);
};

export default CommunitySwitcher;
