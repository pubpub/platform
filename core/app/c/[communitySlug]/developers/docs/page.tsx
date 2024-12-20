import type { Metadata } from "next";

import Script from "next/script";

import "./stoplight.styles.css";

import { env } from "~/lib/env/env.mjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "API Docs",
};

// we load the web component through a script tag here to prevent react incompatibility issues,
// as stoplight uses react 16 still
export default async function IndexPage({
	params: { communitySlug },
}: {
	params: { communitySlug: string };
}) {
	return (
		<>
			<Script src="https://unpkg.com/@stoplight/elements@8.5.2/web-components.min.js" />
			<section className="container">
				<div
					dangerouslySetInnerHTML={{
						__html: `<elements-api
						apiDescriptionUrl="/api/v0/c/${communitySlug}/site/docs/openapi.json"
						router="hash"
						logo="/logos/icon.svg"
						layout="responsive"
						${env.NODE_ENV === "production" ? 'hideTryItPanel="true"' : ""}
								  />`,
					}}
				/>
			</section>
		</>
	);
}
