import { FlagTriangleRightIcon } from "ui/icon"
import { Skeleton } from "ui/skeleton"

import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"
import { PubListSkeleton } from "../pubs/PubList"

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
				<div className="flex max-w-(--breakpoint-lg) flex-col gap-8">
					{Array.from({ length: 3 }).map((_, idx) => (
						<div key={idx} className="flex flex-col gap-4">
							<Skeleton className="h-6 w-24" />
							<PubListSkeleton amount={3} />
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
