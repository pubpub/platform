"use client";
import { Box, Button, Divider, Flex, Heading, IconButton } from "@chakra-ui/react";
// import styles from "./PubList.module.css";
// import PubRow from "./PubRow";
import { WorkflowsData } from "./page";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import StageRow from "./StageRow";

type Props = { workflows: NonNullable<WorkflowsData> };

// const getParent = (pub: Props["pubs"][number]) => {
// 	return pub.values.find((value) => {
// 		return value.field.name === "Parent";
// 	});
// };
// const getTopPubs = (pubs: Props["pubs"]) => {
// 	return pubs.filter((pub) => {
// 		return !getParent(pub);
// 	});
// };
// const getChildren = (pubs: Props["pubs"], parentId: string) => {
// 	return pubs.filter((pub) => {
// 		return getParent(pub)?.value === parentId;
// 	});
// };
const WorkflowList: React.FC<Props> = function ({ workflows }) {
	return (
		<div>
			{workflows.map((workflow) => {
				return (
					<div key={workflow.id}>
						<Box mb="20">
							<Heading as="h3" size="sm">
								{workflow.name}
							</Heading>
							<Divider />
							{workflow.stages.map((stage) => {
								return <StageRow key={stage.id} stage={stage} />;
							})}
						</Box>
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
export default WorkflowList;
