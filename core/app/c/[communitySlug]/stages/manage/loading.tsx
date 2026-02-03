import { Skeleton } from "ui/skeleton"

export default function Loading() {
	return (
		<div className="absolute top-0 left-0 z-20 h-full w-full shadow-[inset_6px_0px_10px_-4px_rgba(0,0,0,0.1)]">
			<Skeleton />
		</div>
	)
}
