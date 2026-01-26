import { Settings } from "lucide-react"

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
					<Settings size={20} strokeWidth={1} className="mr-2 text-muted-foreground" />
					Community Settings
				</ContentLayoutTitle>
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="container ml-0 max-w-(--breakpoint-md) px-4 py-6 md:px-6">
					<Skeleton className="mb-6 h-4 w-96" />
					<div className="space-y-6">
						{Array.from({ length: 4 }).map((_, idx) => (
							<div key={idx} className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-10 w-full" />
							</div>
						))}
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
