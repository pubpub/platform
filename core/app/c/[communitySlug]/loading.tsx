import { Skeleton } from "ui/skeleton"
import { Spinner } from "ui/spinner"

import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton"
import { ContentLayout } from "./ContentLayout"

export default function Loading() {
	return (
		<ContentLayout
			title={
				<>
					<Skeleton className="mr-2 size-6 rounded-full" />
					<Skeleton className="h-8 w-48 md:w-96" />
				</>
			}
			right={<SkeletonButton className="w-24" />}
			className="grid place-items-center overflow-hidden"
		>
			<Spinner />
		</ContentLayout>
	)
}
