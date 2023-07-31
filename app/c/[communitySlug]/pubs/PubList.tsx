"use client";
// import { Box, Button, Flex, IconButton } from "@chakra-ui/react";
import styles from "./PubList.module.css";
import PubRow from "./PubRow";
import { PubsData } from "./page";
// import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";

type Props = { pubs: NonNullable<PubsData>; topPubs?: NonNullable<PubsData> };

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
const PubList: React.FC<Props> = function ({ pubs, topPubs }) {
	const pubsToRender = topPubs || getTopPubs(pubs);
	const [jankyExpandState, setJankyExpandState] = useState({});
	return (
		<div>
			{pubsToRender.map((pub) => {
				const children = getChildren(pubs, pub.id);
				return (
					<div key={pub.id}>
						{/* <Flex
							align="center"
							mt="-1px"
							borderTop={"1px solid #ddd"}
							borderBottom={"1px solid #ddd"}
						>
							{children.length ? (
								<IconButton
									variant="ghost"
									width="15px"
									aria-label="Expand"
									icon={
										jankyExpandState[pub.id] ? (
											<ChevronDownIcon />
										) : (
											<ChevronRightIcon />
										)
									}
									onClick={() => {
										setJankyExpandState({
											...jankyExpandState,
											[pub.id]: !jankyExpandState[pub.id],
										});
									}}
								/>
							) : (
								<Box w="40px" />
							)}
							<Box flex="1">
								<PubRow pub={pub} />
							</Box>
						</Flex>

						{!!children.length && jankyExpandState[pub.id] && (
							<div style={{ marginLeft: "25px" }}>
								<PubList pubs={pubs} topPubs={children} />
							</div>
						)} */}
					</div>
				);
			})}
		</div>
	);
};
export default PubList;
