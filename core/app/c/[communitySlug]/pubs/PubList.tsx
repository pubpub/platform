"use client";
import { useState } from "react";
import { Button } from "ui";
import PubRow from "./PubRow";
import { PubPayload } from "~/lib/types";

type Props = { pubs: PubPayload[]; topPubs?: PubPayload[]; token: string; stages: any[] };

const getParent = (pub: Props["pubs"][number]) => {
	return pub.values.find((value) => {
		return value.field.name === "Parent";
	});
};
const getTopPubs = (pubs: Props["pubs"]) => {
	return pubs.filter((pub) => {
		return !getParent(pub);
	});
};
const getChildren = (pubs: Props["pubs"], parentId: string) => {
	return pubs.filter((pub) => {
		return getParent(pub)?.value === parentId;
	});
};

const PubList: React.FC<Props> = function ({ pubs, topPubs, token, stages }) {
	const pubsToRender = topPubs || getTopPubs(pubs);
	const [jankyExpandState, setJankyExpandState] = useState({});
	console.log(stages);
	return (
		<div>
			{pubsToRender.map((pub) => {
				const children = getChildren(pubs, pub.id);
				return (
					<div key={pub.id}>
						<div className="flex items-center mt-[-1px] border-t border-b border-gray-100">
							{children.length ? (
								<Button
									variant="ghost"
									size="icon"
									aria-label="Expand"
									onClick={() => {
										setJankyExpandState({
											...jankyExpandState,
											/* @ts-ignore */
											[pub.id]: !jankyExpandState[pub.id],
										});
									}}
								>
									{/* @ts-ignore */}
									{/* {jankyExpandState[pub.id] ? "<" : ">"} */}
									<img src="/icons/chevron-vertical.svg" />
								</Button>
							) : (
								<div className="w-[40px]" />
							)}
							<div className="flex-1">
								<PubRow pub={pub} token={token} stages={stages} />
							</div>
						</div>

						{/* @ts-ignore */}
						{!!children.length && jankyExpandState[pub.id] && (
							<div className="ml-6">
								<PubList
									pubs={pubs}
									topPubs={children}
									token={token}
									stages={stages}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
export default PubList;
