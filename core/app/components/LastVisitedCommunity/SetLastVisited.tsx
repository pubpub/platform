"use client";

import { useEffect } from "react";

import { setLastVisited } from "~/app/components/LastVisitedCommunity/lastVisited";
import { useServerAction } from "~/lib/serverActions";

export default function SetLastVisited({ communitySlug }: { communitySlug: string }) {
	const runSetLastVisited = useServerAction(setLastVisited);

	useEffect(() => {
		runSetLastVisited(communitySlug);
	}, [communitySlug, runSetLastVisited]);

	return <></>;
}
