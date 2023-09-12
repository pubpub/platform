import * as React from "react";
import { cn } from "utils";
import { PubpubLogo } from "./PubPubLogo";
import { useIntegration } from "./IntegrationProvider";
import { IntegrationAvatar } from "./IntegrationAvatar";

export const IntegrationLayoutHeader = () => {
	const { name, user } = useIntegration();
	return (
		<header className={cn("mb-8")}>
			<div className={cn("mb-4 flex flex-row")}>
				<PubpubLogo className="w-10 h-10 mr-4" width="100%" height="100%" />
				<IntegrationAvatar name={user.name} url={user.avatar!} />
			</div>
			<h1 className={cn("font-mono")}>{name}</h1>
		</header>
	);
};
