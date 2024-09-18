import Link from "next/link";

import type { CommunitiesId } from "db/public";
import { Button } from "ui/button";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";

type Props = {
	communityId: CommunitiesId;
	searchParams: Record<string, unknown>;
};

const PubHeader: React.FC<Props> = ({ communityId, searchParams }) => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<CreatePubButton communityId={communityId} searchParams={searchParams} />
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
export default PubHeader;
