"use client";

import * as React from "react";
import { useContext } from "react";
import { IntegrationContext } from "./IntegrationContext";

export type IntegrationProviderProps = React.PropsWithChildren<IntegrationContext>;

export const IntegrationProvider = (props: IntegrationProviderProps) => {
	return (
		<IntegrationContext.Provider value={props}>{props.children}</IntegrationContext.Provider>
	);
};

export const useIntegration = () => {
	return useContext(IntegrationContext);
};
