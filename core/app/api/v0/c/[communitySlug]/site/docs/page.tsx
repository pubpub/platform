import type { Metadata } from "next";

import Script from "next/script";

import "./stoplight.styles.css";

import { notFound } from "next/navigation";

import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {};

// we load the web component through a script tag here to prevent react incompatibility issues,
// as stoplight uses react 16 still
export default async function IndexPage({
	params: { communitySlug },
}: {
	params: { communitySlug: string };
}) {
	const [_, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!community) {
		return notFound();
	}

	return (
		<>
			<Script src="https://unpkg.com/@stoplight/elements@8.5.2/web-components.min.js" />
			<section className="container">
				<div
					dangerouslySetInnerHTML={{
						__html: `<elements-api
						apiDescriptionUrl="/api/v0/c/${communitySlug}/site/docs/openapi.json"
						router="hash"
						layout="sidebar"
								  />`,
					}}
				/>
			</section>
		</>
	);
}
