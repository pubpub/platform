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
					<BookOpen size={20} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Pubs
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton count={2} />
			</ContentLayoutHeader>
			<ContentLayoutBody className="relative flex flex-col gap-4 overflow-hidden p-4">
				<SkeletonSearchRoot>
					<SkeletonSearchBar className="relative w-full" />
					<div className="flex w-full items-center gap-2">
						<SkeletonSearchButton className="w-20" />
						<SkeletonSearchButton className="w-20" />
						<SkeletonSearchButton className="ml-auto w-26" />
					</div>
				</SkeletonSearchRoot>
				<PubListSkeleton amount={10} />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
