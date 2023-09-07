"use client";
import { useState } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "ui";
import { PubsData } from "./page";

type Props = { pub: NonNullable<PubsData>[number], token: string };
type IntegrationAction = { text: string, href: string, kind?: "stage" };

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
	return statusValue?.value as { text: string; color: string };
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

const appendQueryParams = (instanceId: string, pubId: string, token: string) => {
	return (action: IntegrationAction) => {
		const url = new URL(action.href);
		url.searchParams.set('instanceId', instanceId);
		url.searchParams.set('pubId', pubId)
		url.searchParams.set('token', token)
		return {
			...action,
			href: url.toString(),
		}
	}
}

const getButtons = (pub: Props["pub"], token: Props["token"]) => {
	const instances = getInstances(pub);
	const buttons = instances.map((instance) => {
		const integration = instance.integration;
		const status = getStatus(pub, integration.id);
		const actions: IntegrationAction[] =
			(Array.isArray(integration.actions) ? integration.actions : []).
				map(appendQueryParams(integration.id, pub.id, token));
		return { status, actions };
	});

	return buttons;
};

const PubRow: React.FC<Props> = function ({ pub, token }) {
	const instances = getInstances(pub);
	const buttons = getButtons(pub, token);
	const [modalTitle, setModalTitle] = useState("");
	const onClose = () => {
		setModalTitle("");
	};
	return (
		<div className="pt-2 pb-2">
			<div className="flex items-center justify-between">
				<div className="text-sm">{pub.pubType.name}</div>
				<div className="flex items-center text-gray-600">
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="sm">
								<img src="/icons/integration.svg" />
								<div className="flex items-baseline">
									<div className="text-sm whitespace-nowrap ml-1">
										{buttons.length} Integration
										{buttons.length !== 1 ? "s" : ""}
									</div>
									{buttons.map((button) => {
										return (
											<div
												key={button.actions![0].text}
												// className={`w-2 h-2 rounded-lg ml-1 bg-[${button.status.color}]`}
												className={`w-2 h-2 rounded-lg ml-1 bg-amber-500`}
											/>
										);
									})}
								</div>
							</Button>
						</PopoverTrigger>
						<PopoverContent>
							{buttons.map((button) => {
								if (!Array.isArray(button.actions)) {
									return null;
								}
								return button.actions.map((action: IntegrationAction) => {
									if (!(action.text && action.href)) {
										return null;
									}
									// Don't render "stage" only actions in the pub row
									if (action.kind === "stage") {
										return null;
									}
									return (
										<Button
											variant="ghost"
											size="sm"
											key={action.text}
										>
											<div className="w-2 h-2 rounded-lg mr-2 bg-amber-500" />
											<a href={action.href}>{action.text}</a>
										</Button>
									)
								})
							})}
							{/* <PopoverHeader>Integrations</PopoverHeader>
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
													{index < instances.length - 1 && (
														<Divider mt={3} mb={3} />
													)}
												</div>
											);
										})}
									</PopoverBody> */}
						</PopoverContent>
					</Popover>
				</div>
			</div>
			<div className="mt-0 items-stretch flex justify-between">
				<h3 className="text-md font-semibold">{getTitle(pub)}</h3>
				<div className="flex items-end shrink-0">
					<Button size="sm" variant="outline" className="ml-1">
						Move
					</Button>
					<Button size="sm" variant="outline" className="ml-1">
						Claim
					</Button>
					<Button size="sm" variant="outline" className="ml-1">
						Email Members
					</Button>
				</div>
			</div>
		</div>

		// <Box pt={2} pb={2}>
		// 	<Flex align="center">
		// 		<Text fontSize="xs">{pub.pubType.name}</Text>
		// 		<Spacer />
		// 		<Flex align="center" textColor="#888">
		// 			{!!buttons.length && (
		// 				<Popover size="lg">
		// 					{/* <PopoverTrigger>
		// 						<Button
		// 							variant="ghost"
		// 							size="xs"
		// 							textColor="#888"
		// 							fontWeight="normal"
		// 						>
		// 							<Box>
		// 								<img src="/icons/integration.svg" />
		// 							</Box>

		// 							<Flex align="baseline">
		// 								<Text fontSize="xs" whiteSpace="nowrap" ml={1}>
		// 									{buttons.length} Integration
		// 									{buttons.length > 1 ? "s" : ""}
		// 								</Text>
		// 								{buttons.map((button) => {
		// 									return (
		// 										<Box
		// 											style={{
		// 												width: "8px",
		// 												height: "8px",
		// 												borderRadius: "8px",
		// 												background: button.status.color,
		// 											}}
		// 											ml={1}
		// 										/>
		// 									);
		// 								})}
		// 							</Flex>
		// 						</Button>
		// 					</PopoverTrigger> */}
		// 					<Portal>

		// 					</Portal>
		// 				</Popover>
		// 			)}

		// 			<Box ml={5}>
		// 				<img src="/icons/members.svg" />
		// 			</Box>
		// 			<Text fontSize="xs" whiteSpace="nowrap" ml={1}>
		// 				3 Members
		// 			</Text>
		// 		</Flex>
		// 	</Flex>
		// 	<Flex mt={0} align="flex-start">
		// 		<Heading as="h3" size="sm">
		// 			{getTitle(pub)}
		// 		</Heading>
		// 		<Spacer />
		// 		<Flex alignItems="baseline">
		// 			<Button size="xs" variant="outline" ml={2}>
		// 				Move
		// 			</Button>
		// 			<Button size="xs" variant="outline" ml={2}>
		// 				Claim
		// 			</Button>
		// 			<Button size="xs" variant="outline" ml={2}>
		// 				Email Members
		// 			</Button>
		// 			{buttons.map((button) => {
		// 				return (
		// 					<Box key={button.actions[0].href} ml={2}>
		// 						{/* @ts-ignore */}
		// 						{/* <NextLink href={button.actions[0].href} passHref legacyBehavior> */}
		// 							{/* <Button as="a" size="xs" variant="outline"> */}
		// 								<Button
		// 							size="xs"
		// 							variant="outline"
		// 							onClick={() => {
		// 								setModalTitle(button.actions[0].text);
		// 							}}
		// 						>
		// 								<Flex align="center">
		// 									{button.actions[0].text}
		// 									<Box
		// 										style={{
		// 											width: "8px",
		// 											height: "8px",
		// 											borderRadius: "8px",
		// 											background: button.status.color,
		// 										}}
		// 										ml={1}
		// 									/>
		// 								</Flex>
		// 							</Button>
		// 						{/* </NextLink> */}

		// 						{/* <Flex align="center">
		// 							<Box
		// 								style={{
		// 									width: "8px",
		// 									height: "8px",
		// 									borderRadius: "8px",
		// 									background: button.status.color,
		// 								}}
		// 								mr={1}
		// 							/>
		// 							<Text fontSize="xs">{button.status.text}</Text>
		// 						</Flex> */}
		// 					</Box>
		// 				);
		// 			})}
		// 		</Flex>
		// 	</Flex>
		// 	<Modal onClose={onClose} size="full" isOpen={!!modalTitle}>
		// 		<ModalOverlay />
		// 		<ModalContent>
		// 			<ModalHeader>{modalTitle}</ModalHeader>
		// 			<ModalCloseButton />
		// 			<ModalBody></ModalBody>
		// 			<ModalFooter>
		// 				<Button onClick={onClose}>Close</Button>
		// 			</ModalFooter>
		// 		</ModalContent>
		// 	</Modal>
		// </Box>
	);
};
export default PubRow;
