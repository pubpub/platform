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
					<ClipboardPenLine /> Forms
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<SkeletonTable />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
