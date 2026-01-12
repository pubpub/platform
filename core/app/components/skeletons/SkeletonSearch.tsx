import { Skeleton } from "ui/skeleton"
import { cn } from "utils"

export const SkeletonSearchRoot = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	return <div className={cn("flex w-full items-center gap-2", className)}>{children}</div>
}

export const SkeletonSearchButton = ({ className }: { className?: string }) => {
	return <Skeleton className={cn("h-9 w-20 border border-border", className)} />
}
export const SkeletonSearchBar = ({ className }: { className?: string }) => {
	return <Skeleton className={cn("h-9 flex-1 border border-border", className)} />
}

export const SkeletonSearch = ({ className, buttons }: { className?: string; buttons: number }) => {
	return (
		<div className={cn("flex w-full items-center gap-2", className)}>
			<SkeletonSearchBar />
			{Array.from({ length: buttons }).map((_, index) => (
				<SkeletonSearchButton key={index} />
			))}
		</div>
	)
}
