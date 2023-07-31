import { getLoginData } from "@/lib/auth/loginData";
import styles from "./LoginSwitcher.module.css";

export default async function LoginSwitcher() {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	return (
		<div className={styles.switcher}>
			<div className={styles.avatar}>
				<img src={loginData.avatar || ""} />
			</div>
			<div className={styles.details}>
				<div className={styles.name}>{loginData.name}</div>
				<div className={styles.email}>{loginData.email}</div>
			</div>

			<div>
				<img className={styles.icon} src="/icons/ellipsis.svg" />
			</div>
		</div>
	);
}
