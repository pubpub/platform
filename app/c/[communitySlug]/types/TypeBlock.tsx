"use client";
import {
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Flex,
	Heading,
	IconButton,
	Spacer,
	Text,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { TypesData } from "./page";
import { useState } from "react";

type Props = { type: NonNullable<TypesData>[number] };

const TypeBlock: React.FC<Props> = function ({ type }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<Card variant="outline" size="sm">
			<CardBody>
				<Flex align="center">
					<Text fontWeight="bold">{type.name}</Text>
					<Spacer />
					<IconButton
						variant="ghost"
						width="15px"
						aria-label="Expand"
						icon={expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
						onClick={() => {
							setExpanded(!expanded);
						}}
					/>
				</Flex>
				<Text fontSize="sm">{type.description}</Text>
				{expanded && (
					<Box mt={5} ml={5}>
						<ul>
							{type.fields.map((field) => {
								return <li key={field.id}>{field.name}</li>;
							})}
						</ul>
					</Box>
				)}
			</CardBody>
		</Card>
	);
};
export default TypeBlock;
