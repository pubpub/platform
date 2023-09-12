import * as React from "react";
import { IntegrationLayoutHeader } from "./IntegrationLayoutHeader";

export const IntegrationLayout = (props: React.PropsWithChildren) => {
	return (
		<div className="min-h-screen">
			<div className="container mx-auto py-5">
				<IntegrationLayoutHeader />
				<div className="flex-auto">{props.children}</div>
			</div>
		</div>
	);
};
