"use client"

import { useTheme } from "next-themes"

export const StopLight = ({
	communitySlug,
	hideTryItPanel = false,
}: {
	communitySlug: string
	hideTryItPanel?: boolean
}) => {
	const { resolvedTheme } = useTheme()
	return (
		<div
			className="h-full"
			dangerouslySetInnerHTML={{
				__html: `<elements-api
                    data-theme="${resolvedTheme}"
                    style="min-height: 100vh;"
                    apiDescriptionUrl="/c/${communitySlug}/developers/docs/openapi.json"
                    router="hash"
                    logo="/logos/icon.svg"
                    layout="sidebar"
                    ${hideTryItPanel ? 'hideTryItPanel="true"' : ""}
                              />`,
			}}
		/>
	)
}
