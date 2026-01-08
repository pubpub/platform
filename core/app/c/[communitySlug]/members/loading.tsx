import { Users } from "ui/icon"
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
					<Users size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Members
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4 space-y-3">
					{Array.from({ length: 6 }).map((_, idx) => (
						<div key={idx} className="flex items-center gap-3 rounded-lg border p-4">
							<Skeleton className="size-10 rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-48" />
							</div>
							<Skeleton className="h-6 w-20" />
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
