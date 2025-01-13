import * as React from "react"

import { cn } from "utils"

import { IntegrationAvatar } from "./IntegrationAvatar"
import { useIntegration } from "./IntegrationProvider"
import { PubpubLogo } from "./PubPubLogo"

export const IntegrationLayoutHeader = () => {
	const { name, user } = useIntegration()
	return (
		<header className={cn("mb-8")}>
			<div className={cn("mb-4 flex flex-row")}>
				<PubpubLogo className="mr-4 h-10 w-10" width="100%" height="100%" />
				<IntegrationAvatar firstName={user.firstName} url={user.avatar!} />
			</div>
			<h1 className={cn("font-mono")}>{name}</h1>
		</header>
	)
}
