import { FormInput } from "ui/icon"

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
					<FormInput /> Fields Fields
				</ContentLayoutTitle>
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<SkeletonTable />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
