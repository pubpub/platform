import { Activity } from "ui/icon"
import { Skeleton } from "ui/skeleton"

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
					<Activity size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Automation Logs
				</ContentLayoutTitle>
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="space-y-2 p-4">
					{Array.from({ length: 8 }).map((_, idx) => (
						<div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
							<Skeleton className="size-8 rounded-full" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-3 w-32" />
							</div>
							<Skeleton className="h-6 w-16" />
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
