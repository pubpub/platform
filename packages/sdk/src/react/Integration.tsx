import * as React from "react";

import { LocalStorageProvider } from "ui/hooks";

import type { IntegrationProviderProps } from "./IntegrationProvider";
import { IntegrationLayout } from "./IntegrationLayout";
import { IntegrationProvider } from "./IntegrationProvider";

export type IntegrationProps<T> = IntegrationProviderProps<T>;

export function Integration<T>(props: IntegrationProps<T>) {
	const { children, ...options } = props;
	return (
		<LocalStorageProvider prefix={`pubpub-integration/${options.name}/`} timeout={200}>
			<IntegrationProvider {...options}>
				<IntegrationLayout>{children}</IntegrationLayout>
			</IntegrationProvider>
		</LocalStorageProvider>
	);
}
