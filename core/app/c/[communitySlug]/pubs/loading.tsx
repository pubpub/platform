import { BookOpen } from "lucide-react"

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
			<ContentLayoutBody className="overflow-hidden">
				<PubListSkeleton amount={8} className="p-4" />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
