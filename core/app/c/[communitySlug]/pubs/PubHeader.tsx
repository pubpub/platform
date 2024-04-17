import Link from "next/link";

import { Button } from "ui/button";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import { CreatePubButton } from "~/app/components/CreatePubButton";

type Props = {
	communityId: CommunitiesId;
};

const PubHeader: React.FC<Props> = ({ communityId }) => {
	return (
		<div className="mb-16 flex items-center justify-between">
			<h1 className="flex-grow text-xl font-bold">Pubs</h1>
			<div className="flex items-center gap-x-2">
				<CreatePubButton communityId={communityId} />
				<Button variant="outline" size="sm" asChild>
					<Link href="types">Manage Types</Link>
				</Button>
			</div>
		</div>
	);
};
export default PubHeader;
