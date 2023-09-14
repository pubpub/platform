"use client";
import React from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "ui";
import { PubPayload } from "~/lib/types";

type Props = {
	pub: PubPayload;
	token: string;
	actions?: React.ReactNode;
};

type IntegrationAction = { text: string; href: string; kind?: "stage" };

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

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

const PubRow: React.FC<Props> = function ({ pub, token, actions }) {
	const buttons = getButtons(pub, token);

	return (
		<div className="pt-2 pb-2">
			<h3 className="text-md font-semibold">{getTitle(pub)}</h3>
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
			{actions}
		</div>
	);
};
export default PubRow;
