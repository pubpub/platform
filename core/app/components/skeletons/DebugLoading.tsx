import { env } from "~/lib/env/env"

/**
 * overlays the loading.tsx over a page and displays the loading state, making all the elements slightly red
 *
 * set `env.DEBUG_LOADING` to `true` to enable
 *
 * @usage
 * // on page.tsx
 * return (
 *     <DebugLoading loading={<Loading />}>
 *         <YourPage />
 *     </DebugLoading>
 * )
 */
export default function DebugLoading(props: {
	loading: React.ReactNode
	children: React.ReactNode
}) {
	if (!env.DEBUG_LOADING) {
		return props.children
	}

	return (
		<>
			<div className="absolute inset-0 z-[5000] opacity-50 **:ring-1 **:ring-red-500 [&_.animate-pulse]:bg-red-200">
				{props.loading}
			</div>
			{props.children}
		</>
	)
}
