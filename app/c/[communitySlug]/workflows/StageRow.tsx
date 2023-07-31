"use client";
import { Box, Button, Divider, Flex, Heading, IconButton, Spacer, Text } from "@chakra-ui/react";
// import styles from "./PubList.module.css";
// import PubRow from "./PubRow";
import { WorkflowsData } from "./page";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import PubRow from "../pubs/PubRow";

type Props = { stage: NonNullable<WorkflowsData>[number]["stages"][number] };

const StageRow: React.FC<Props> = function ({ stage }) {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<Box>
			<Flex
				align="center"
				mt="-1px"
				borderTop={"1px solid #ddd"}
				borderBottom={"1px solid #ddd"}
			>
				<IconButton
					variant="ghost"
					width="15px"
					aria-label="Expand"
					icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
					onClick={() => {
						setIsExpanded(!isExpanded);
					}}
				/>

				<Box flex="1">
					<Flex>
						{stage.name}
						<Spacer />
						<Box ml={5}>
							<img src="/icons/pub.svg" />
						</Box>
						<Text fontSize="xs" whiteSpace="nowrap" ml={1}>
							{stage.pubs.length} Pub{stage.pubs.length === 1 ? "" : "s"}
						</Text>
					</Flex>
				</Box>
			</Flex>
			{isExpanded &&
				stage.pubs.map((pub) => {
					return (
						<Box key={pub.id} mt="-1px"
						borderTop={"1px solid #ddd"}
						borderBottom={"1px solid #ddd"} ml={10}>
							<PubRow pub={pub} />
						</Box>
					);
				})}
		</Box>
	);
};
export default StageRow;
