import { BookOpen } from "lucide-react"

import { Skeleton } from "ui/skeleton"

import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"
import { PubListSkeleton } from "./PubList"

export default function Loading() {
	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<BookOpen size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Pubs
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton count={2} />
			</ContentLayoutHeader>
			<ContentLayoutBody className="overflow-hidden p-4">
				<div className="flex w-full items-center gap-2">
					<Skeleton className="mb-8 h-9 flex-1" />
					<Skeleton className="mb-8 h-9 w-20" />
					<Skeleton className="mb-8 h-9 w-20" />
					<Skeleton className="mb-8 h-9 w-25" />
				</div>
				<PubListSkeleton amount={10} />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
