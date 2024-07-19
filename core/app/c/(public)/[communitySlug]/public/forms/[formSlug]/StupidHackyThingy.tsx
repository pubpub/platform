"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function StupidHackyThingy() {
	const router = useRouter();
	useEffect(() => {
		router.refresh();
	}, []);
	return <></>;
}
