import { Button } from "ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "ui/hover-card";
import { PubPayload } from "~/lib/types";
import Assign from "../c/[communitySlug]/stages/components/Assign";

type Props = {
	pub: PubPayload;
	token: string;
};

type IntegrationAction = { text: string; href: string; kind?: "stage" };

const getStatus = (pub: Props["pub"], integrationId: string) => {
	const statusValue = pub.values.find((value) => {
		return value.field.integrationId === integrationId;
	});
	return statusValue?.value as { text: string; color: string };
};

const getInstances = (pub: Props["pub"]) => {
	return pub.integrationInstances.concat(
		pub.stages.flatMap((stage) => stage.integrationInstances)
	);
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

const IntegrationActions = (props: Props) => {
	const buttons = getButtons(props.pub, props.token);

	return buttons.length ? (
		<ul className="list-none flex flex-row">
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
							{props.pub.claims.length > 0 ? (
								<Button variant="outline" size="sm" key={action.href}>
									<div className="w-2 h-2 rounded-lg mr-2 bg-amber-500" />
									<a href={action.href}>{action.text}</a>
								</Button>
							) : (
								<HoverCard defaultOpen>
									<HoverCardTrigger asChild>
										<Button variant="outline" size="sm" key={action.href}>
											<div className="w-2 h-2 rounded-lg mr-2 bg-amber-500" />
											<p>{action.text}</p>
										</Button>
									</HoverCardTrigger>
									<HoverCardContent className=" w-auto m-auto space-y-1">
										<h2 className="text-sm font-semibold">No Assignees</h2>
										<p className="text-sm pb-2">
											Assign a manager to this pub to enable this action.
										</p>
									</HoverCardContent>
								</HoverCard>
							)}
						</li>
					);
				});
			})}
		</ul>
	) : null;
};

export default IntegrationActions;
