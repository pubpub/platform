"use client";
import styles from "./PinnedLink.module.css";
import Link from "next/link";

type Props = { href: string; text: string };

export default function PinnedLink({ href, text }: Props) {
	return (
		<Link className={styles.link} href={href}>
			<div className={styles.text}>{text}</div>
		</Link>
	);
}
