"use client";
import React from "react";
import {
	Button,
	Card,
	CardContent,
	CardTitle,
	CardFooter,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Dialog,
	DialogContent,
	DialogTrigger,
	Tooltip,
	TooltipTrigger,
	// TooltipContent,
} from "ui";
import { PubsData } from "./page";
import Image from "next/image";

type Props = {
	pub: NonNullable<PubsData>[number];
	token: string;
	community?: NonNullable<PubsData>[number]["community"];
};
type IntegrationAction = { text: string; href: string; kind?: "stage" };

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
		url.searchParams.set("instanceId", instanceId);
		url.searchParams.set("pubId", pubId);
		url.searchParams.set("token", token);
		return {
			...action,
			href: url.toString(),
		};
	};
};

const getButtons = (pub: Props["pub"], token: Props["token"]) => {
	const instances = getInstances(pub);
	const buttons = instances
		.map((instance) => {
			const integration = instance.integration;
			const status = getStatus(pub, integration.id);
			const actions: IntegrationAction[] = (
				Array.isArray(integration.actions) ? integration.actions : []
			)
				.filter((action: IntegrationAction) => action.kind !== "stage")
				.map(appendQueryParams(instance.id, pub.id, token));
			return { status, actions };
		})
		.filter((instance) => instance && instance.actions.length);

	return buttons;
};

const getUsers = (community: Props["community"]) => {
	return (
		community &&
		community.members.map((member) => {
			return {
				id: member.id,
				name: member.user.name,
				email: member.user.email,
				avatar: member.user.avatar,
				initials: member.user.name
					.split(" ")
					.map((name) => name[0])
					.join("")
					.toUpperCase(),
			};
		})
	);
};

const PubRow: React.FC<Props> = function ({ pub, community, token }) {
	const buttons = getButtons(pub, token);
	const members = getUsers(community);
	const [open, setOpen] = React.useState(false);

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
												key={button.actions[0].text}
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
										<Button variant="ghost" size="sm" key={action.text}>
											<div className="w-2 h-2 rounded-lg mr-2 bg-amber-500" />
											<a href={action.href}>{action.text}</a>
										</Button>
									);
								});
							})}
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
					<Popover>
						<PopoverTrigger asChild>
							<Button size="sm" variant="outline" className="ml-1">
								Assign
							</Button>
						</PopoverTrigger>
						<PopoverContent className="flex flex-col">
							<Tooltip>
								<TooltipTrigger>
									<Button variant="secondary" className="mb-5">
										Claim
									</Button>
								</TooltipTrigger>
								{/* <TooltipContent>Assign this pub to yourself</TooltipContent> */}
							</Tooltip>
							{members &&
								members.map((member) => {
									return (
										<Dialog open={open} onOpenChange={setOpen}>
											<DialogTrigger>
												<Button size="sm" variant="ghost" key={member.id}>
													<div className="mr-4">
														<Image
															src={member.avatar ?? member.initials}
															alt={member.initials}
															width={20}
															height={20}
														/>
													</div>
													<span>{member.name}</span>
												</Button>
											</DialogTrigger>
											<DialogContent>
												<Card>
													<CardTitle>
														Assign <i>{getTitle(pub)}</i> to{" "}
														{member.name}?
													</CardTitle>
													<CardContent>
														{member.name} will be notified that they
														have been assigned to this Pub.
													</CardContent>
													<CardFooter className="flex flex-row">
														<Button variant="default">Assign</Button>
														<Button
															className="mx-3"
															variant="secondary"
															onClick={() => setOpen(false)}
														>
															Cancel
														</Button>
													</CardFooter>
												</Card>
											</DialogContent>
										</Dialog>
									);
								})}
						</PopoverContent>
					</Popover>
					<Button size="sm" variant="outline" className="ml-1">
						Email Members
					</Button>
				</div>
			</div>
		</div>
	);
};
export default PubRow;
