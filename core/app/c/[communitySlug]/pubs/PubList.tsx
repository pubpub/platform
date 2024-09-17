import type { CommunitiesId, PubsId } from "db/public";
import { cn } from "utils";

import type { PubWithChildren } from "~/lib/server";
import type { XOR } from "~/lib/types";
import PubRow from "~/app/components/PubRow";
import { getPubs } from "~/lib/server";

type Props = {
	token: string | Promise<string>;
} & XOR<{ pubs: PubWithChildren[] }, { communityId: CommunitiesId }>;

/**
 * Renders a list pubs
 * You can either pass the pubs directly, or the communityId to get all the pubs in the community
 */
const PubList: React.FC<Props> = async (props) => {
	const allPubs = props.pubs ?? (await getPubs(props.communityId));
	const token = await props.token;

	return (
		<div className={cn("flex flex-col gap-8")}>
			{allPubs.map((pub) => {
				return <PubRow key={pub.id} pub={pub} token={token} />;
			})}
		</div>
	);
};
export default PubList;
