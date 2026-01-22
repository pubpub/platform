/**
 * overlays the loading.tsx over a page and displays the loading state, making all the elements slightly red
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
	return (
		<>
			<div className="absolute inset-0 z-[5000] opacity-75 **:ring-1 **:ring-red-500 [&_.animate-pulse]:bg-red-200">
				{props.loading}
			</div>
			{props.children}
		</>
	)
}
