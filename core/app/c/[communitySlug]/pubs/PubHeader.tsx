import { Suspense } from "react";
import Link from "next/link";

import { Button } from "ui/button";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";

export const PubHeader = () => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<Suspense fallback={<SkeletonButton className="w-20" />}>
					<CreatePubButton text="Create" />
				</Suspense>
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
