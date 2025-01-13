import * as React from "react"
import { useContext } from "react"

import { IntegrationContext } from "./IntegrationContext"

export type IntegrationProviderProps<T> = React.PropsWithChildren<IntegrationContext<T>>

export function IntegrationProvider<T>(props: IntegrationProviderProps<T>) {
	return <IntegrationContext.Provider value={props}>{props.children}</IntegrationContext.Provider>
}

export const useIntegration = () => {
	return useContext(IntegrationContext)
}
