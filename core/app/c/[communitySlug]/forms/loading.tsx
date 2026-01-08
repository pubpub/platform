import { ClipboardPenLine } from "ui/icon"

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
					<ClipboardPenLine
						size={24}
						strokeWidth={1}
						className="mr-2 text-muted-foreground"
					/>{" "}
					Forms
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
