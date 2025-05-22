import React from "react";

import type { ProcessedPub } from "contracts";

export const PubCard = ({
	pub,
}: {
	pub: ProcessedPub<{ withPubType: true; withRelatedPubs: false; withStage: true }>;
}) => {
	return (
		<>
			<div data-testid={`pub-row-${pub.id}`}>
				<div>
					<div className="flex flex-row items-center justify-between">
						<div className="text-sm font-semibold text-gray-500">
							{pub.pubType.name}
						</div>
						<div className="flex flex-row gap-x-2">
							{/* <div>{props.actions}</div> */}
							{/* <PubDropDown pubId={pub.id} searchParams={props.searchParams} /> */}
						</div>
					</div>
				</div>
				<div className="flex items-start justify-between">
					<h3 className="text-md font-medium">
						{/* <Link
							href={`/c/${communitySlug}/pubs/${pub.id}`}
							className="hover:underline"
						>
							<PubTitle pub={pub} />
						</Link> */}
					</h3>
				</div>
			</div>
		</>
	);
};
