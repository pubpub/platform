"use client";
import Image from "next/image";
import React, { Fragment } from "react";
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useToast,
} from "ui";
import { expect } from "utils";
import { PubPayload, StagePayload, User } from "~/lib/types";
import { assign, move } from "./actions";
import cn from "~/lib/cn";

type Props = {
	pub: PubPayload;
	token: string;
	stages?: StagePayload[];
	stage?: StagePayload;
	loginData?: User;
};

type IntegrationAction = { text: string; href: string; kind?: "stage" };

const groupPubChildrenByPubType = (pubs: PubPayload["children"]) => {
	const pubTypes = pubs.reduce((prev, curr) => {
		const pubType = curr.pubType;
		if (!prev[pubType.id]) {
			prev[pubType.id] = {
				pubType,
				pubs: [],
			};
		}
		prev[pubType.id].pubs.push(curr);
		return prev;
	}, {} as { [key: string]: { pubType: PubPayload["pubType"]; pubs: PubPayload["children"] } });
	return Object.values(pubTypes);
};

const getTitle = (values: Props["pub"]["values"]) => {
	const title = values.find((value) => {
		return value.field.name === "Title";
	});
	return title?.value as string;
};

const getStatus = (pub: Props["pub"], integrationId: string) => {
	const status = pub.values.find((value) => {
		return value.field.integrationId === integrationId;
	});
	return status?.value as { text: string; color: string };
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

const getUsers = (community: PubPayload["community"]) => {
	return (
		community &&
		community.members.map((member) => {
			return {
				userId: member.userId,
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

const PubRow: React.FC<Props> = function (props) {
	const { pub, token, stages, stage, loginData } = props;
	const buttons = getButtons(pub, token);
	const members = getUsers(pub.community);
	const { toast } = useToast();
	const [open, setOpen] = React.useState(false);

	const onAssign = async (pubId: string, userId: string, stageId: string) => {
		const err = await assign(pubId, userId, stageId);
		if (err) {
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
			return;
		}
		setOpen(false);
		toast({
			title: "Success",
			description: "User was succesfully assigned.",
			variant: "default",
		});
	};

	const onMove = async (pubId: string, sourceStageId: string, destStageId: string) => {
		const err = await move(pubId, sourceStageId, destStageId);
		if (err) {
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
			return;
		}
		toast({
			title: "Success",
			description: "Pub was successfully moved",
			variant: "default",
		});
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
										<Button variant="ghost" size="sm" key={action.href}>
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
				<h3 className="text-md font-semibold">{getTitle(pub.values)}</h3>
				<div className="flex items-end shrink-0">
					{/* TODO: if no assigned members, don't show move button to non admin */}
					{stage && (
						<div>
							<Popover>
								<PopoverTrigger asChild>
									<Button size="sm" variant="outline" className="ml-1">
										Move
									</Button>
								</PopoverTrigger>
								<PopoverContent>
									<div className="flex flex-col">
										<div className="mb-4">
											<b>Move this pub to:</b>
										</div>
										{stages
											? stages.map((s) => {
													return s.id === stage.id ? null : (
														<Button
															variant="ghost"
															key={s.name}
															onClick={() =>
																onMove(pub.id, stage.id, s.id)
															}
														>
															{s.name}
														</Button>
													);
											  })
											: "No stages are present in your community"}
									</div>
								</PopoverContent>
							</Popover>
							<Popover>
								<PopoverTrigger asChild>
									<Button size="sm" variant="outline" className="ml-1">
										Assign
									</Button>
								</PopoverTrigger>
								<PopoverContent className="flex flex-col">
									<Button
										variant="secondary"
										className="mb-5"
										onClick={() =>
											// we will not need this expect when the permissions branch that broke up this component is merged
											onAssign(pub.id, expect(loginData).id, stage.id)
										}
									>
										Claim
									</Button>
									{members &&
										members.map((member) => {
											return (
												<Dialog open={open} onOpenChange={setOpen}>
													<DialogTrigger>
														<Button
															size="sm"
															variant="ghost"
															key={member.userId}
														>
															<div className="mr-4">
																<Image
																	src={
																		member.avatar ??
																		member.initials
																	}
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
															<CardTitle className="space-y-1.5 p-6">
																Assign <i>{getTitle(pub.values)}</i>{" "}
																to {member.name}?
															</CardTitle>
															<CardContent>
																{member.name} will be notified that
																they have been assigned to this Pub.
															</CardContent>
															<CardFooter className="flex flex-row">
																{stage ? (
																	<Button
																		onClick={() =>
																			onAssign(
																				pub.id,
																				member.userId,
																				stage.id
																			)
																		}
																	>
																		Assign
																	</Button>
																) : (
																	"This pub isnt on a stage yet."
																)}
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
						</div>
					)}
					<Button size="sm" variant="outline" className="ml-1">
						Email Members
					</Button>
				</div>
			</div>
			{pub.children.length > 0 && (
				<Collapsible>
					<CollapsibleTrigger>
						<div>
							<span className={cn("mr-2")}>Contents:</span>
							{groupPubChildrenByPubType(pub.children).map((group) => (
								<em key={group.pubType.id} className={cn("mr-2")}>
									{group.pubType.name} ({group.pubs.length})
								</em>
							))}
						</div>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<ChildHierarchy pub={pub} />
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
};

const ChildHierarchy = ({ pub }: { pub: PubPayload }) => {
	return (
		<dl className={cn("ml-4")}>
			{groupPubChildrenByPubType(pub.children).map((group) => (
				<Fragment key={group.pubType.id}>
					<dt key={group.pubType.id}>
						<strong>{group.pubType.name}</strong>
					</dt>
					<dd>
						<ul>
							{group.pubs.map((child) => (
								<li key={child.id} className={cn("ml-4")}>
									{/* @ts-ignore */}
									<div>{getTitle(child.values)}</div>
									{/* @ts-ignore */}
									{pub.children?.length > 0 && <ChildHierarchy pub={child} />}
								</li>
							))}
						</ul>
					</dd>
				</Fragment>
			))}
		</dl>
	);
};

export default PubRow;
