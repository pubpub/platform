import { Key } from "lucide-react"

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
					<Key size={24} strokeWidth={1} className="mr-2 text-muted-foreground" /> API
					Tokens
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4">
					<div className="grid gap-6">
						{Array.from({ length: 3 }).map((_, idx) => (
							<div key={idx} className="rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-20" />
								</div>
								<Skeleton className="mt-2 h-4 w-48" />
							</div>
						))}
					</div>
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
