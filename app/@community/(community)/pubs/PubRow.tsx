"use client";
import {
	Box,
	Button,
	Divider,
	Flex,
	Heading,
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	Portal,
	Spacer,
	Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import styles from "./PubRow.module.css";
import { PubsData } from "./page";

type Props = { pub: NonNullable<PubsData>[number] };

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

const getStatus = (pub: Props["pub"], integrationId: string) => {
	const statusValue = pub.values.find((value) => {
		return value.field.integrationId === integrationId;
	});
	return statusValue?.value as string;
};

const getInstances = (pub: Props["pub"]) => {
	const pubInstances = pub.integrationInstances;
	const stageInstances = pub.stages
		.map((stage) => {
			return stage.integrationInstances;
		})
		.reduce((prev, curr) => {
			if (!prev) {
				return curr;
			}
			return [...prev, ...curr];
		}, []);
	const instances = [...pubInstances, ...stageInstances];
	return instances;
};
const getButtons = (pub: Props["pub"]) => {
	const instances = getInstances(pub);
	const buttons = instances.map((instance) => {
		const integration = instance.integration;
		const status = getStatus(pub, integration.id);
		const actions = integration.actions;
		return { status, actions };
	});

	return buttons;
};

const PubRow: React.FC<Props> = function ({ pub }) {
	const instances = getInstances(pub);
	const buttons = getButtons(pub);
	return (
		<Box pt={2} pb={2}>
			<Flex align="center">
				<Text fontSize="xs">{pub.pubType.name}</Text>
				<Spacer />
				<Flex align="center" textColor="#888">
					{!!buttons.length && (
						<Popover size="lg">
							<PopoverTrigger>
								<Button
									variant="ghost"
									size="xs"
									textColor="#888"
									fontWeight="normal"
								>
									<Box>
										<img src="/icons/integration.svg" />
									</Box>

									<Flex align="baseline">
										<Text fontSize="xs" whiteSpace="nowrap" ml={1}>
											{buttons.length} Integration
											{buttons.length > 1 ? "s" : ""}
										</Text>
										{buttons.map((button) => {
											return (
												<Box
													style={{
														width: "8px",
														height: "8px",
														borderRadius: "8px",
														background: button.status.color,
													}}
													ml={1}
												/>
											);
										})}
									</Flex>
								</Button>
							</PopoverTrigger>
							<Portal>
								<PopoverContent>
									<PopoverHeader>Integrations</PopoverHeader>
									<PopoverBody>
										{instances.map((instance, index) => {
											const status = getStatus(pub, instance.integration.id);
											const actions = instance.integration.actions;
											return (
												<div>
													<Text fontSize="xs" color="#888">
														{instance.integration.name}
													</Text>
													{instance.name}

													<Flex align="center">
														<Box
															style={{
																width: "8px",
																height: "8px",
																borderRadius: "8px",
																background: status.color,
															}}
															mr={1}
														/>
														<Text fontSize="sm">{status.text}</Text>
														<Spacer />
														<NextLink
															href={actions[0].href}
															passHref
															legacyBehavior
														>
															<Button
																as="a"
																size="sm"
																variant="outline"
															>
																{actions[0].text}
															</Button>
														</NextLink>
													</Flex>
													{index < instances.length - 1 && <Divider mt={3} mb={3} />}
												</div>
											);
										})}
									</PopoverBody>
								</PopoverContent>
							</Portal>
						</Popover>
					)}

					<Box ml={5}>
						<img src="/icons/members.svg" />
					</Box>
					<Text fontSize="xs" whiteSpace="nowrap" ml={1}>
						3 Members
					</Text>
				</Flex>
			</Flex>
			<Flex mt={0} align="flex-start">
				<Heading as="h3" size="sm">
					{getTitle(pub)}
				</Heading>
				<Spacer />
				<Flex alignItems="baseline">
					<Button size="xs" variant="outline" ml={2}>
						Move
					</Button>
					<Button size="xs" variant="outline" ml={2}>
						Claim
					</Button>
					{buttons.map((button) => {
						return (
							<Box key={button.actions[0].href} ml={2}>
								{/* @ts-ignore */}
								<NextLink href={button.actions[0].href} passHref legacyBehavior>
									<Button as="a" size="xs" variant="outline">
										<Flex align="center">
											{button.actions[0].text}
											<Box
												style={{
													width: "8px",
													height: "8px",
													borderRadius: "8px",
													background: button.status.color,
												}}
												ml={1}
											/>
										</Flex>
									</Button>
								</NextLink>
								{/* <Flex align="center">
									<Box
										style={{
											width: "8px",
											height: "8px",
											borderRadius: "8px",
											background: button.status.color,
										}}
										mr={1}
									/>
									<Text fontSize="xs">{button.status.text}</Text>
								</Flex> */}
							</Box>
						);
					})}
				</Flex>
			</Flex>
		</Box>
	);
};
export default PubRow;
