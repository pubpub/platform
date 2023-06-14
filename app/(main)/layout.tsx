import styles from "./layout.module.css";
import SideNav from "./SideNav";

type Props = { children: React.ReactNode; params: string };

export default async function MainLayout({ children }: Props) {
	return (
		<div className={styles.panel}>
			<SideNav />
			<div className={styles.main}>{children}</div>
		</div>
	);
}
