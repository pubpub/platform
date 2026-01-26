import { FlagTriangleRightIcon } from "lucide-react"

import { Skeleton } from "ui/skeleton"

import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../../ContentLayout"

export default function Loading() {
	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<FlagTriangleRightIcon
						size={20}
						strokeWidth={1}
						className="mr-2 text-muted-foreground"
					/>
					<Skeleton className="h-6 w-32" />
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton count={2} />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4 max-w-(--breakpoint-lg) space-y-4">
					{Array.from({ length: 4 }).map((_, idx) => (
						<Skeleton key={idx} className="h-20 w-full rounded-lg" />
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
