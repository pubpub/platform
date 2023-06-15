"use client";
import styles from "./CommunitySwitcher.module.css";


export default function CommunitySwitcher() {
	return (
		<div className={styles.switcher}>
			<img className={styles.logo} src="/logos/mitp.jpg" />
			<div className={styles.text}>MIT Press</div>
			<img className={styles.icon} src="/icons/chevron-vertical.svg" />
		</div>
	);
}
