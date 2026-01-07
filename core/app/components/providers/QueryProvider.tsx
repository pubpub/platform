"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { client, retryPolicy } from "~/lib/api"

export function ReactQueryProvider({ children }: React.PropsWithChildren) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: retryPolicy,
			},
		},
	})

	return (
		<QueryClientProvider client={queryClient}>
			<client.ReactQueryProvider>{children}</client.ReactQueryProvider>
			{/* <ReactQueryDevtools /> */}
		</QueryClientProvider>
	)
}
