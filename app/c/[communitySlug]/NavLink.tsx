"use client";
import styles from "./NavLink.module.css";
import Link from "next/link";

type Props = { href: string; text: string; icon: React.ReactNode; count?: number };

export default function NavLink({ href, text, icon, count }: Props) {
	return (
		<Link className={`${styles.link} ${!href && styles.null}`} href={href}>
			<div className={styles.icon}>{icon}</div>
			<div className={styles.text}>{text}</div>
			{count && <div className={styles.count}>{count}</div>}
		</Link>
	);
}
