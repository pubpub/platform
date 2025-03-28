// shared actions between server and client

import type * as z from "zod";

import type { ActionInstances, Event } from "db/public";

import type { SequentialRuleEvent } from "../types";
import {
	actionFailed,
	actionSucceeded,
	pubEnteredStage,
	pubInStageForDuration,
	pubLeftStage,
} from "../_lib/rules";
import * as datacite from "../datacite/action";
import * as email from "../email/action";
import * as googleDriveImport from "../googleDriveImport/action";
import * as http from "../http/action";
import * as log from "../log/action";
import * as move from "../move/action";
import * as pdf from "../pdf/action";
import * as pushToV6 from "../pushToV6/action";
import { isSequentialRuleEvent, sequentialRuleEvents } from "../types";

export const actions = {
	[log.action.name]: log.action,
	[pdf.action.name]: pdf.action,
	[email.action.name]: email.action,
	[pushToV6.action.name]: pushToV6.action,
	[http.action.name]: http.action,
	[move.action.name]: move.action,
	[googleDriveImport.action.name]: googleDriveImport.action,
	[datacite.action.name]: datacite.action,
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

export const rules = {
	[pubInStageForDuration.event]: pubInStageForDuration,
	[pubEnteredStage.event]: pubEnteredStage,
	[pubLeftStage.event]: pubLeftStage,
	[actionSucceeded.event]: actionSucceeded,
	[actionFailed.event]: actionFailed,
} as const;

export const getRuleByName = <T extends Event>(name: T) => {
	return rules[name];
};

export const isReferentialRule = (
	rule: (typeof rules)[keyof typeof rules]
): rule is Extract<typeof rule, { event: SequentialRuleEvent }> =>
	sequentialRuleEvents.includes(rule.event as any);

export const humanReadableEvent = <T extends Event>(
	event: T,
	config?: (typeof rules)[T]["additionalConfig"] extends undefined
		? never
		: z.infer<NonNullable<(typeof rules)[T]["additionalConfig"]>>,
	sourceAction?: ActionInstances | null
) => {
	const rule = getRuleByName(event);
	if (config && rule.additionalConfig) {
		return rule.display.withConfig(config);
	}
	if (sourceAction && isReferentialRule(rule)) {
		return rule.display.withConfig(sourceAction);
	}

	return rule.display.base;
};

export const serializeRule = <T extends Event>(
	event: T,
	instanceName: string,
	config?: (typeof rules)[T]["additionalConfig"] extends undefined
		? never
		: z.infer<NonNullable<(typeof rules)[T]["additionalConfig"]>>
) => `${instanceName} will run when ${humanReadableEvent(event, config)}`;
