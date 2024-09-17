import type { IntegrationInstances, Integrations, PubsId } from "db/public";
import { Button } from "ui/button";

import type { PubPayload } from "~/lib/server/_legacy-integration-queries";
import { autoCache } from "~/lib/server/cache/autoCache";
import { getIntegrationInstanceBase } from "~/lib/server/stages";

type Props = {
	pubId: PubsId;
	token: string;
};

type IntegrationAction = { text: string; href: string; kind?: "stage" };
type IntegrationInstance = IntegrationInstances & { integration: Integrations };

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

const getButtons = (pubId: PubsId, instances: IntegrationInstance[], token: Props["token"]) => {
	const buttons = instances
		.map((instance) => {
			const integration = instance.integration;
			const actions: IntegrationAction[] = (
				Array.isArray(integration.actions) ? integration.actions : []
			)
				.filter((action: IntegrationAction) => action.kind !== "stage")
				.map(appendQueryParams(instance.id, pubId, token));
			return { actions };
		})
		.filter((instance) => instance && instance.actions.length);

	return buttons;
};

const IntegrationActions = async (props: Props) => {
	const integrationInstances = await autoCache(
		getIntegrationInstanceBase()
			.innerJoin("PubsInStages", "integration_instances.stageId", "PubsInStages.stageId")
			.where("PubsInStages.pubId", "=", props.pubId)
	).execute();

	const buttons = getButtons(props.pubId, integrationInstances, props.token);

	return buttons.length ? (
		<ul className="flex list-none flex-row">
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
	) : null;
};

export default IntegrationActions;
