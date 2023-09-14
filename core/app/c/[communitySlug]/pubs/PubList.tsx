"use client";
import { PubPayload } from "~/lib/types";
import PubRow from "./PubRow";

type Props = { pubs: PubPayload[]; token: string };

const PubList: React.FC<Props> = function ({ pubs, token }) {
	return (
		<div>
			{pubs.map((pub) => {
				return (
					<div key={pub.id}>
						<div className="flex items-center mt-[-1px] border-t border-b border-gray-100">
							<div className="flex-1">
								<PubRow pub={pub} token={token} />
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};
export default PubList;
