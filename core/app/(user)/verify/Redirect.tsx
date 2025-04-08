"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const Redirect = ({ url }: { url: string }) => {
	const router = useRouter();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.push(url);
		}, 5_000);

		return () => clearTimeout(timer);
	}, [router]);

	return <p>Redirecting in 5 seconds...</p>;
};
