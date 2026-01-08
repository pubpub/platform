import { BookOpen } from "lucide-react"

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
					<BookOpen size={24} strokeWidth={1} className="mr-3 text-muted-foreground" />
					<Skeleton className="h-6 w-48 md:w-64" />
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton count={3} />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-1">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-6 w-16" />
				</div>
				<div className="m-4 space-y-4">
					{Array.from({ length: 5 }).map((_, idx) => (
						<div key={idx} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-10 w-full" />
						</div>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
