import { FlagTriangleRightIcon } from "ui/icon"
import { Skeleton } from "ui/skeleton"

import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"

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
					Stages
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton count={2} />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4 max-w-(--breakpoint-lg) space-y-4">
					{Array.from({ length: 3 }).map((_, idx) => (
						<div key={idx} className="rounded-lg border p-4">
							<Skeleton className="mb-2 h-6 w-32" />
							<div className="space-y-2">
								{Array.from({ length: 2 }).map((_, pubIdx) => (
									<Skeleton key={pubIdx} className="h-16 w-full" />
								))}
							</div>
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
