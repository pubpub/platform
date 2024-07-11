import Link from "next/link";

import type { CommunitiesId } from "db/public/Communities";
import { Button } from "ui/button";

import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";

type Props = {
	communityId: CommunitiesId;
};

const PubHeader: React.FC<Props> = ({ communityId }) => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<PubCreateButton communityId={communityId} />
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
export default PubHeader;
