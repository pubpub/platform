import { Skeleton } from "ui/skeleton"

export const SkeletonMemberCard = () => {
	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<Skeleton className="size-9 rounded-full" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-48" />
			</div>
			<Skeleton className="h-6 w-20" />
		</div>
	)
}

export const SkeletonMemberCardList = ({ amount = 6 }: { amount?: number }) => {
	return (
		<div className="flex flex-col gap-2">
			{Array.from({ length: amount }).map((_, idx) => (
				<SkeletonMemberCard key={idx} />
			))}
		</div>
	)
}
