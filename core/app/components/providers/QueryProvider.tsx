"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { client } from "~/lib/api"

export function ReactQueryProvider({ children }: React.PropsWithChildren) {
	const queryClient = new QueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<client.ReactQueryProvider>{children}</client.ReactQueryProvider>
			<ReactQueryDevtools />
		</QueryClientProvider>
	)
}
