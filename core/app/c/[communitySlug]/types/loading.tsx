import { ToyBrick } from "ui/icon"

import SkeletonTable from "~/app/components/skeletons/SkeletonTable"
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
					<ToyBrick size={24} strokeWidth={1} className="mr-2 text-muted-foreground" />{" "}
					Types
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<div className="m-4">
					<SkeletonTable />
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
