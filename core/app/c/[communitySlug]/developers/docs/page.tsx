import type { Metadata } from "next"

import Script from "next/script"

import "./stoplight.styles.css"

import { redirect } from "next/navigation"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { isCommunityAdmin } from "~/lib/authentication/roles"
import { env } from "~/lib/env/env.mjs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
	title: "API Docs",
}

// we load the web component through a script tag here to prevent react incompatibility issues,
// as stoplight uses react 16 still
export default async function IndexPage({
	params: { communitySlug },
}: {
	params: { communitySlug: string }
}) {
	const { user } = await getPageLoginData()

	// TODO: add capability for this
	if (!isCommunityAdmin(user, { slug: communitySlug })) {
		return redirect(`/c/${communitySlug}/unauthorized`)
	}

	return (
		<div className="absolute inset-0 min-h-screen">
			<Script src="https://unpkg.com/@stoplight/elements@8.5.2/web-components.min.js" />
			<div
				className="h-full"
				dangerouslySetInnerHTML={{
					__html: `<elements-api
						style="min-height: 100vh;"
						apiDescriptionUrl="/c/${communitySlug}/developers/docs/openapi.json"
						router="hash"
						logo="/logos/icon.svg"
						layout="sidebar"
						${env.NODE_ENV === "production" ? 'hideTryItPanel="true"' : ""}
								  />`,
				}}
			/>
		</div>
	)
}
