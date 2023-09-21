"use client";
import { cn } from "utils";
import PubRow from "~/app/components/PubRow";
import { PubPayload } from "~/lib/types";

type Props = { pubs: PubPayload[]; token: string };

const PubList: React.FC<Props> = function ({ pubs, token }) {
	return (
		<div className={cn("flex flex-col gap-2")}>
			{pubs.map((pub) => {
				return <PubRow key={pub.id} pub={pub} token={token} />;
			})}
		</div>
	);
};
export default PubList;
