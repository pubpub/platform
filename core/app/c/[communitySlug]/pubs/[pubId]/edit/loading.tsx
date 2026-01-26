import { Skeleton } from "ui/skeleton"
import { cn } from "utils"

import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutStickySecondaryHeader,
	ContentLayoutTitle,
} from "../../../ContentLayout"

export default function Loading() {
	return (
		<ContentLayoutRoot>
			<ContentLayoutHeader>
				<ContentLayoutTitle>
					<Skeleton className="h-6 w-48 md:w-80" />
				</ContentLayoutTitle>

				<ContentLayoutActions>
					<Skeleton className="h-8 w-14" />
				</ContentLayoutActions>
			</ContentLayoutHeader>
			<ContentLayoutBody>
				<ContentLayoutStickySecondaryHeader>
					<div className="flex h-8 items-center gap-2">
						<Skeleton className="h-6 w-48 md:w-80" />
					</div>
				</ContentLayoutStickySecondaryHeader>

				<div className="flex justify-center py-10">
					<div className="flex max-w-full flex-1 flex-col gap-6 px-4 md:max-w-prose">
						{Array.from({ length: 8 }).map((_, idx) => {
							const random = Math.random()
							return (
								<div key={idx} className="flex flex-col gap-2">
									<Skeleton className="h-5 w-24" />
									<Skeleton
										className={cn(
											"w-full border bg-accent/40 bg-transparent",
											random > 0.2 ? "h-9" : random > 0.6 ? "h-16" : "h-30"
										)}
									/>
								</div>
							)
						})}
					</div>
				</div>
			</ContentLayoutBody>
		</ContentLayoutRoot>
	)
}
