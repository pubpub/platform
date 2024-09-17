import type { PubsId } from "db/public";
import { cn } from "utils";

import type { PubPayload } from "~/lib/server/_legacy-integration-queries";
import PubRow from "~/app/components/PubRow";

type Props = { pubs: PubPayload[]; token: string };

const PubList: React.FC<Props> = function ({ pubs, token }) {
	return (
		<div className={cn("flex flex-col gap-2")}>
			{pubs.map((pub) => {
				return <PubRow key={pub.id} pubId={pub.id as PubsId} token={token} />;
			})}
		</div>
	);
};
export default PubList;
