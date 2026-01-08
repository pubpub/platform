import { Fragment } from "react"
import { BookOpen } from "lucide-react"

import { Separator } from "ui/separator"
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
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-5 w-16" />
				</div>
				<div className="m-4 space-y-4">
					{Array.from({ length: 8 }).map((_, idx, arr) => (
						<Fragment key={idx}>
							<div key={idx} className="grid grid-cols-14 gap-2">
								<div className="col-span-3 col-start-1 flex flex-col items-start gap-2 md:col-span-2 md:col-start-2">
									<Skeleton className="h-4 w-14" />
									<Skeleton className="h-4 w-24" />
								</div>
								<Skeleton className="col-span-9 col-start-4 h-10 w-full md:col-start-4" />
							</div>
							{idx < arr.length - 1 && <Separator className="col-span-14" />}
						</Fragment>
					))}
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
