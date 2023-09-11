"use client";

import * as React from "react";
import { LocalStorageProvider } from "ui";
import { IntegrationLayout } from "./IntegrationLayout";
import { IntegrationProvider, IntegrationProviderProps } from "./IntegrationProvider";

export type IntegrationProps = IntegrationProviderProps;

export const Integration = (props: IntegrationProps) => {
	const { children, ...options } = props;
	return (
		<LocalStorageProvider prefix={`pubpub-integration/${options.name}/`} timeout={1000}>
			<IntegrationProvider {...options}>
				<IntegrationLayout>{children}</IntegrationLayout>
			</IntegrationProvider>
		</LocalStorageProvider>
	);
};
