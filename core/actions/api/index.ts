// shared actions between server and client

import type * as z from "zod";

import type { ActionInstances, Automations, Communities } from "db/public";

import type { SequentialAutomationEvent } from "../types";
import {
	actionFailed,
	actionSucceeded,
	pubEnteredStage,
	pubInStageForDuration,
	pubLeftStage,
	webhook,
} from "../_lib/automations";
import * as buildJournalSite from "../buildJournalSite/action";
import * as datacite from "../datacite/action";
import * as email from "../email/action";
import * as googleDriveImport from "../googleDriveImport/action";
import * as http from "../http/action";
import * as log from "../log/action";
import * as move from "../move/action";
import { sequentialAutomationEvents } from "../types";

export const actions = {
	[log.action.name]: log.action,
	[email.action.name]: email.action,
	[http.action.name]: http.action,
	[move.action.name]: move.action,
	[googleDriveImport.action.name]: googleDriveImport.action,
	[datacite.action.name]: datacite.action,
	[buildJournalSite.action.name]: buildJournalSite.action,
} as const;

export const getActionByName = <N extends keyof typeof actions>(name: N) => {
	if (!(name in actions)) {
		throw new Error(`Action ${name} not found`);
	}

	return actions[name];
};

export const getActionNames = () => {
	return Object.keys(actions) as (keyof typeof actions)[];
};

export const automations = {
	[pubInStageForDuration.event]: pubInStageForDuration,
	[pubEnteredStage.event]: pubEnteredStage,
	[pubLeftStage.event]: pubLeftStage,
	[actionSucceeded.event]: actionSucceeded,
	[actionFailed.event]: actionFailed,
	[webhook.event]: webhook,
} as const satisfies Record<AutomationEvent, any>;

export const getAutomationByName = <T extends AutomationEvent>(name: T) => {
	return automations[name];
};

export const isReferentialAutomation = (
	automation: (typeof automations)[keyof typeof automations]
): automation is Extract<typeof automation, { event: SequentialAutomationEvent }> =>
	sequentialAutomationEvents.includes(automation.event as any);

export const humanReadableEventBase = <T extends AutomationEvent>(
	event: T,
	community: Communities
) => {
	const automation = getAutomationByName(event);

	if (typeof automation.display.base === "function") {
		return automation.display.base({ community });
	}

	return automation.display.base;
};

export const humanReadableEventHydrated = <T extends AutomationEvent>(
	event: T,
	community: Communities,
	options: {
		automation: Automations;
		config?: (typeof automations)[T]["additionalConfig"] extends undefined
			? never
			: z.infer<NonNullable<(typeof automations)[T]["additionalConfig"]>>;
		sourceAction?: ActionInstances | null;
	}
) => {
	const automationConf = getAutomationByName(event);
	if (options.config && automationConf.additionalConfig && automationConf.display.hydrated) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: options.config,
		});
	}
	if (
		options.sourceAction &&
		isReferentialAutomation(automationConf) &&
		automationConf.display.hydrated
	) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: options.sourceAction,
		});
	}

	if (automationConf.display.hydrated && !automationConf.additionalConfig) {
		return automationConf.display.hydrated({
			automation: options.automation,
			community,
			config: {} as any,
		});
	}

	if (typeof automationConf.display.base === "function") {
		return automationConf.display.base({ community });
	}

	return automationConf.display.base;
};

export const humanReadableAutomation = <A extends Automations>(
	automation: A,
	community: Communities,
	instanceName: string,
	config?: (typeof automations)[A["event"]]["additionalConfig"] extends undefined
		? never
		: z.infer<NonNullable<(typeof automations)[A["event"]]["additionalConfig"]>>,
	sourceAction?: ActionInstances | null
) =>
	`${instanceName} will run when ${humanReadableEventHydrated(automation.event, community, { automation: automation, config, sourceAction })}`;
