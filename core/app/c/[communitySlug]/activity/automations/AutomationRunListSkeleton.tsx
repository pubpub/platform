import { Skeleton } from "ui/skeleton"
import { cn } from "utils"

export const AutomationRunListSkeleton = ({
	amount = 10,
	className,
}: {
	amount?: number
	className?: string
}) => (
	<div className={cn(["flex flex-col gap-3", className])}>
		{Array.from({ length: amount }).map((_, index) => (
			<Skeleton
				key={index}
				className="flex h-[110px] w-full flex-col gap-2 rounded-md border px-4 py-3"
			>
				<div className="flex items-start gap-3">
					<Skeleton className="mt-1 h-8 w-8 rounded-sm" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
			</Skeleton>
		))}
	</div>
)
