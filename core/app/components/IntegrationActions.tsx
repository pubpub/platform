import { cache } from "react";

import type {
	IntegrationInstances,
	IntegrationInstancesId,
	Integrations,
	PubsId,
	StagesId,
} from "db/public";
import { Button } from "ui/button";

import { getIntegrationInstancesForStage } from "~/lib/server/stages";

type Props = {
	token: string;
} & (
	| {
			type: "pub";
			integrationInstances: IntegrationInstance[];
			pubId: PubsId;
			stageId?: never;
	  }
	| {
			type: "pub";
			integrationInstances?: never;
			pubId: PubsId;
			stageId: StagesId;
	  }
	| {
			type: "stage";
			integrationInstances?: IntegrationInstance[];
			stageId: StagesId;
			pubId?: never;
	  }
);

type IntegrationAction = { text: string; href: string; kind?: "stage" };
type IntegrationInstance = IntegrationInstances & { integration: Integrations };

const appendQueryParams = (
	props:
		| {
				type: "stage";
				instanceId: IntegrationInstancesId;
				token: string;
		  }
		| {
				type: "pub";
				instanceId: IntegrationInstancesId;
				pubId: PubsId;
				token: string;
		  }
) => {
	return (action: IntegrationAction) => {
		const url = new URL(action.href);
		url.searchParams.set("instanceId", props.instanceId);
		url.searchParams.set("token", props.token);

		if (props.type === "pub") {
			url.searchParams.set("pubId", props.pubId);
		}

		return {
			...action,
			href: url.toString(),
		};
	};
};

const getButtons = ({
	instances,
	token,
	...rest
}: {
	instances: IntegrationInstance[];
	token: Props["token"];
} & (
	| {
			type: "stage";
			pubId?: never;
	  }
	| { type: "pub"; pubId: PubsId }
)) => {
	const buttons = instances
		.map((instance) => {
			const integration = instance.integration;
			const actions: IntegrationAction[] = (
				Array.isArray(integration.actions) ? integration.actions : []
			)
				.filter((action: IntegrationAction) =>
					rest.type === "stage" ? action.kind === "stage" : action.kind !== "stage"
				)
				.map(
					appendQueryParams({
						instanceId: instance.id,
						token,
						...rest,
					})
				);
			return { actions };
		})
		.filter((instance) => instance && instance.actions.length);

	return buttons;
};

const cachedGetIntegrationActionsForStage = cache((stageId: StagesId) =>
	getIntegrationInstancesForStage(stageId).execute()
);

const IntegrationActions = async (props: Props) => {
	const integrationInstances =
		props.integrationInstances ?? (await cachedGetIntegrationActionsForStage(props.stageId));

	if (!integrationInstances.length) {
		return null;
	}

	const buttons = getButtons({
		...props,
		instances: integrationInstances,
	});

	if (!buttons.length) {
		return null;
	}

	return (
		<ul className="flex list-none flex-row">
			{buttons.map((button) => {
				return button.actions.map((action: IntegrationAction) => {
					if (!(action.text && action.href)) {
						return null;
					}

					return (
						<li key={action.href} className="flex items-stretch">
							<Button variant="outline" size="sm" key={action.href}>
								<div className="mr-2 h-2 w-2 rounded-lg bg-amber-500" />
								<a href={action.href}>{action.text}</a>
							</Button>
						</li>
					);
				});
			})}
		</ul>
	);
};

export default IntegrationActions;
