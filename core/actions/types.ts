import type * as z from "zod";

import type { Json, ProcessedPub } from "contracts";
import type {
	ActionInstances,
	Action as ActionName,
	ActionRunsId,
	Automations,
	Communities,
	CommunitiesId,
	StagesId,
	UsersId,
} from "db/public";
import type { LastModifiedBy } from "db/types";
import type { Dependency, FieldConfig, FieldConfigItem } from "ui/auto-form";
import type * as Icons from "ui/icon";
import type { Prettify, XOR } from "utils/types";
import { AutomationEvent } from "db/public";

import type { ClientExceptionOptions } from "~/lib/serverActions";

export type ActionPub = ProcessedPub<{
	withPubType: true;
	withRelatedPubs: undefined;
}>;

export type RunProps<T extends Action> =
	T extends Action<infer C, any, infer Acc extends ActionRunAccepts[]>
		? Prettify<
				{
					config: C["_output"] & { pubFields: { [K in keyof C["_output"]]?: string[] } };
					stageId: StagesId;
					communityId: CommunitiesId;
					/**
					 * The lastModifiedBy field, to be used when you are
					 * creating/modifying pubs
					 * Will likely look like: `action-run:<action-run-id>
					 */
					lastModifiedBy: LastModifiedBy;
					actionRunId: ActionRunsId;
					/**
					 * The user ID of the user who initiated the action, if any
					 */
					userId?: UsersId;
					actionInstance: ActionInstances;
				} &
					// if both are accepted, it's one or the other.
					// if only one's accepted, it's only that one
					("pub" | "json" extends Acc[number]
						? XOR<{ pub: ActionPub }, { json: Json }>
						: ("pub" extends Acc[number]
								? {
										pub: ActionPub;
									}
								: { pub?: never }) &
								("json" extends Acc[number] ? { json: Json } : { json?: never }))
			>
		: never;

export type ConfigProps<C> = {
	config: C;
};

export type TokenDef = {
	[key: string]: {
		description: string;
	};
};

export const actionRunAccepts = ["pub", "json"] as const;
export type ActionRunAccepts = (typeof actionRunAccepts)[number];

export type Action<
	C extends z.ZodObject<any> = z.ZodObject<any>,
	N extends ActionName = ActionName,
	Accepts extends ActionRunAccepts[] = ActionRunAccepts[],
> = {
	id?: string;
	name: N;
	description: string;
	accepts: Accepts;
	/**
	 * The action's configuration
	 *
	 * These are the "statically known" parameters for this action.
	 */
	config: {
		schema: C;
		fieldConfig?: {
			[K in keyof FieldConfig<C["_output"]>]: FieldConfigItem;
		};
		dependencies?: Dependency<z.infer<C>>[];
	};
	/**
	 * The icon to display for this action. Used in the UI.
	 */
	icon: (typeof Icons)[keyof typeof Icons];
	/**
	 * Optionally provide a list of tokens that can be used in the
	 * action's config or arguments.
	 */
	tokens?: {
		[K in keyof C["_output"]]?: TokenDef;
	};
	/**
	 * Optionally mark this action as experimental
	 * At the moment this will simply show an "experimental" badge in the UI when creating
	 * and configuring this action
	 */
	experimental?: boolean;
	/**
	 * This action is only available to super admins
	 */
	superAdminOnly?: boolean;
};

export const defineAction = <
	C extends z.ZodObject<any>,
	N extends ActionName,
	Acc extends ActionRunAccepts[],
>(
	action: Action<C, N, Acc>
) => action;

export type ActionSuccess = {
	success: true;
	/**
	 * Optionally provide a report to be displayed to the user
	 */
	report?: React.ReactNode;
	data: unknown;
};

export const defineRun = <T extends Action = Action>(
	run: (props: RunProps<T>) => Promise<ActionSuccess | ClientExceptionOptions>
) => run;

export type Run = ReturnType<typeof defineRun>;

export const sequentialAutomationEvents = [
	AutomationEvent.actionSucceeded,
	AutomationEvent.actionFailed,
] as const;
export type SequentialAutomationEvent = (typeof sequentialAutomationEvents)[number];

export const isSequentialAutomationEvent = (
	event: AutomationEvent
): AutomationEvent is SequentialAutomationEvent =>
	sequentialAutomationEvents.includes(event as any);

export const schedulableAutomationEvents = [
	AutomationEvent.pubInStageForDuration,
	AutomationEvent.actionFailed,
	AutomationEvent.actionSucceeded,
] as const;
export type SchedulableAutomationEvent = (typeof schedulableAutomationEvents)[number];

export const isSchedulableAutomationEvent = (
	event: AutomationEvent
): AutomationEvent is SchedulableAutomationEvent =>
	schedulableAutomationEvents.includes(event as any);

export type EventAutomationOptionsBase<
	E extends : AutomationEvent,
	AC extends Record<string, any> | undefined = undefined,
> = {
	event: E;
	canBeRunAfterAddingAutomation?: boolean;
	additionalConfig?: AC extends Record<string, any> ? z.ZodType<AC> : undefined;
	/**
	 * The display name options for this event
	 */
	display: {
		icon: (typeof Icons)[keyof typeof Icons];
		/**
		 * The base display name for this automation, shown e.g. when selecting the event for a automation
		 */
		base: React.ReactNode | ((options: { community: Communities }) => React.ReactNode);
		/**
		 * String to use when viewing the automation on the stage.
		 * Useful if you want to show some configuration or automation-specific information
		 */
		hydrated?: (
			options: {
				automation: Automations;
				community: Communities;
			} & (AC extends Record<string, any>
				? { config: AC }
				: E extends SequentialAutomationEvent
					? { config: ActionInstances }
					: {})
		) => React.ReactNode;
	};
};

export const defineAutomation = <
	E extends : AutomationEvent,
	AC extends Record<string, any> | undefined = undefined,
>(
	options: AutomationEventAutomationOptionsBase<E, AC>
) => options;

export type { AutomationConfig, AutomationConfigs } from "./_lib/automations";

export type ConfigOf<T extends Action> = T extends Action<infer C, any, any> ? z.infer<C> : never;

export type ActionInstanceOf<T extends Action> = {
	id: string;
	config?: ConfigOf<T>;
};
