"use client";
// import {
// 	Box,
// 	Button,
// 	Card,
// 	CardBody,
// 	Divider,
// 	Flex,
// 	Heading,
// 	IconButton,
// 	Spacer,
// 	Text,
// } from "@chakra-ui/react";
// import styles from "./PubList.module.css";
// import PubRow from "./PubRow";
import NextLink from "next/link";
import { IntegrationData } from "./page";
// import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
// import IntegrationRow from "./IntegrationRow";

type Props = { instances: NonNullable<IntegrationData> };

const getTitle = (pub: Props["instances"][number]["pubs"][number]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};
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
const IntegrationList: React.FC<Props> = function ({ instances }) {
	return (
		<div>
			{/* <Card mb={10} variant="outline" backgroundColor="#f0f0f0">
				<CardBody>
					<Heading as="h3" size="sm" mb={5}>
						Add Integrations
					</Heading>
					<Flex>
						<Box background="#d9d9d9" borderRadius={"3px"} mr={10} w="100px" h="50px" />
						<Box background="#d9d9d9" borderRadius={"3px"} mr={10} w="100px" h="50px" />
						<Box background="#d9d9d9" borderRadius={"3px"} mr={10} w="100px" h="50px" />
						<Box background="#d9d9d9" borderRadius={"3px"} mr={10} w="100px" h="50px" />
					</Flex>
				</CardBody>
			</Card>
			{instances.map((instance) => {
				return (
					<Card mb={10} variant="outline">
						<CardBody>
							<Flex>
								<Box>
									<Text fontSize="xs">{instance.integration.name}</Text>
									<Heading as="h3" size="sm">
										{instance.name}
									</Heading>
									<Box mt={3}>
										{instance.pubs.map((pub) => {
											return (
												<Text fontSize="sm">
													Attached to pub:{" "}
													<Text as="span" fontWeight="bold">
														{getTitle(pub)}
													</Text>
												</Text>
											);
										})}
										{instance.stages.map((stage) => {
											return (
												<Text fontSize="sm">
													Attached to all pubs in workflow stage:{" "}
													<Text as="span" fontWeight="bold">
														{stage.workflow.name}/{stage.name}
													</Text>
												</Text>
											);
										})}
									</Box>
								</Box>
								<Spacer />
								<NextLink
									href={instance.integration.settingsUrl}
									passHref
									legacyBehavior
								>
									<Button as="a" size="xs" variant="outline">
										Configure
									</Button>
								</NextLink>
							</Flex>
						</CardBody>
					</Card>
				);
			})} */}
		</div>
	);
};
export default IntegrationList;
