import { BookOpen } from "lucide-react"

import {
	SkeletonSearchBar,
	SkeletonSearchButton,
	SkeletonSearchRoot,
} from "~/app/components/skeletons/SkeletonSearch"
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
			<ContentLayoutBody className="flex flex-col gap-4 overflow-hidden">
				<SkeletonSearchRoot>
					<SkeletonSearchBar />
					<SkeletonSearchButton />
					<SkeletonSearchButton />
					<SkeletonSearchButton />
				</SkeletonSearchRoot>
				<PubListSkeleton amount={10} />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
