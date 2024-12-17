"use client";

import { useParams } from "next/navigation";

export function Elements() {
	const { communitySlug } = useParams();

	return (
		<div
			dangerouslySetInnerHTML={{
				__html: `<elements-api
						apiDescriptionUrl="/api/v0/c/${communitySlug}/site/docs/openapi.json"
						router="hash"
						layout="sidebar"
								  />`,
			}}
		/>
	);
}
