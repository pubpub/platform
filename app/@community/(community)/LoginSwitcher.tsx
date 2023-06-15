"use client";
import styles from "./LoginSwitcher.module.css";

export default function LoginSwitcher() {
	return (
		<div className={styles.switcher}>
			<div className={styles.avatar}>
				<img src="/avatars/dumpster.png" />
			</div>
			<div className={styles.details}>
				<div className={styles.name}>Alex Quintero</div>
				<div className={styles.email}>alex@email.com</div>
			</div>

			<div>
				<img className={styles.icon} src="/icons/ellipsis.svg" />
			</div>
		</div>
	);
}
