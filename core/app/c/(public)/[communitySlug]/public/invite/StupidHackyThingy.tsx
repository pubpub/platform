"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RedirectHack({ redirectUrl }: { redirectUrl: string }) {
	const router = useRouter();
	useEffect(() => {
		router.refresh();
	}, []);
	return <></>;
}
