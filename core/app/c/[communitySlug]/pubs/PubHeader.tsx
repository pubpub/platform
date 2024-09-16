import { Suspense } from "react";
import Link from "next/link";

import type { CommunitiesId } from "db/public";
import { Button } from "ui/button";

import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";

type Props = {
	communityId: CommunitiesId;
	searchParams: Record<string, unknown>;
};

const PubHeader: React.FC<Props> = ({ communityId, searchParams }) => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<Suspense
					fallback={<SkeletonButton className="w-20" />}
					key={new Date().toString()}
				>
					<PubCreateButton communityId={communityId} searchParams={searchParams} />
				</Suspense>
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
export default PubHeader;
