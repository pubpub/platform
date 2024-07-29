import type { ReactNode } from "react";

import type { PubsId } from "db/public";

import { PubTitle } from "~/app/components/PubTitle";
import { getPub } from "~/lib/server";
import { HEADER_HEIGHT } from "~/lib/ui";

// Need to offset by the height of the nav bar since that is also sticky so taken out of flow layout
const OFFSET = HEADER_HEIGHT + 16;

const Subheading = ({ children }: { children: ReactNode }) => {
	return <h2 className="border-b text-xs font-semibold uppercase leading-5">{children}</h2>;
};

export const ParentPubInfo = async ({ parentId }: { parentId: string | null | undefined }) => {
	if (!parentId) {
		return null;
	}
	const parent = await getPub(parentId as PubsId);

	return (
		<div className={`sticky rounded bg-gray-50 p-4`} style={{ top: `${OFFSET}px` }}>
			<div className="flex flex-col gap-3">
				<Subheading>Info</Subheading>
				<PubTitle pub={parent} />
				{/* TODO: what content to render here? */}
			</div>
		</div>
	);
};
