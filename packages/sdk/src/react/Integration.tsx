"use client";

import * as React from "react";
import { IntegrationLayout } from "./IntegrationLayout";
import { IntegrationProvider, IntegrationProviderProps } from "./IntegrationProvider";

export type IntegrationProps = IntegrationProviderProps;

export const Integration = (props: IntegrationProps) => {
	const { children, ...options } = props;
	return (
		<IntegrationProvider {...options}>
			<IntegrationLayout>{children}</IntegrationLayout>
		</IntegrationProvider>
	);
};
