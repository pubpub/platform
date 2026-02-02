import { Users } from "ui/icon"

import { SkeletonMemberCardList } from "~/app/components/skeletons/SkeletonMemberCard"
import { SkeletonSearch } from "~/app/components/skeletons/SkeletonSearch"
import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../ContentLayout"

export default function Loading() {
	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<Users size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Members
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4 mt-5 flex flex-col gap-6">
					<SkeletonSearch buttons={0} />
					<SkeletonMemberCardList amount={6} />
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
