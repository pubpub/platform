import { Activity } from "ui/icon"
import { Skeleton } from "ui/skeleton"

import {
	SkeletonSearchBar,
	SkeletonSearchButton,
	SkeletonSearchRoot,
} from "~/app/components/skeletons/SkeletonSearch"
import {
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
					<Activity size={20} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Automation Logs
				</ContentLayoutTitle>
			</ContentLayoutHeader>
			<ContentLayoutBody className="flex flex-col gap-4">
				<SkeletonSearchRoot>
					<SkeletonSearchBar className="w-full grow" />
					<div className="flex items-center gap-2">
						<SkeletonSearchButton className="w-24" />
						<SkeletonSearchButton className="w-24" />
					</div>
				</SkeletonSearchRoot>
				<div className="flex grow flex-col gap-3">
					{Array.from({ length: 8 }).map((_, idx) => (
						<div
							key={idx}
							className="flex h-18 items-center gap-3 rounded-lg border p-2 py-1"
						>
							<Skeleton className="size-8 rounded-full" />
							<div className="flex-1 space-y-4">
								<div className="flex items-center gap-3">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-16" />
								</div>
								<Skeleton className="h-3 w-32" />
							</div>
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
