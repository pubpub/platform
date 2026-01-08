import type { Metadata } from "next"

import { Spinner } from "ui/spinner"

import {
	ContentLayoutActionsSkeleton,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitleSkeleton,
} from "./ContentLayout"

export const metadata: Metadata = {
	title: "Loading...",
	description: "Loading...",
}

export default function Loading() {
	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitleSkeleton />
				<ContentLayoutActionsSkeleton />
			</ContentLayoutHeader>
			<ContentLayoutBody className="grid place-items-center overflow-hidden">
				<Spinner />
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
