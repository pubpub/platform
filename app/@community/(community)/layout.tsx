import { Prisma } from "@prisma/client";
import prisma from "prisma/db";

import styles from "./layout.module.css";
import SideNav from "./SideNav";

export type CommunityData = Prisma.PromiseReturnType<typeof getCommunity>;
export type PinsData = Prisma.PromiseReturnType<typeof getPins>;

const getCommunity = async () => {
	return prisma.community.findFirst();
};

const getPins = async () => {
	return prisma.pin.findMany({
		include: {
			pub: {
				include: { values: { include: { field: true } } },
			},
			workflow: true,
			instance: true,
		},
	});
};

type Props = { children: React.ReactNode; params: string };

export default async function MainLayout({ children }: Props) {
	const community = await getCommunity();
	const pins = await getPins();
	if (!community) {
		return null;
	}
	return (
		<div className={styles.panel}>
			<SideNav community={community} pins={pins} />
			<div className={styles.main}>{children}</div>
		</div>
	);
}
