// shared actions between server and client

import type { Rule } from "ajv/dist/compile/rules";
import type * as z from "zod";

import type { ActionInstances, Communities, Event, Rules } from "db/public";

import type { SequentialRuleEvent } from "../types";
import {
	actionFailed,
	actionSucceeded,
	pubEnteredStage,
	pubInStageForDuration,
	pubLeftStage,
	webhook,
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
	[webhook.event]: webhook,
} as const;
// export type Rules = typeof rules;

export const getRuleByName = <T extends Event>(name: T) => {
	return rules[name];
};

export const isReferentialRule = (
	rule: (typeof rules)[keyof typeof rules]
): rule is Extract<typeof rule, { event: SequentialRuleEvent }> =>
	sequentialRuleEvents.includes(rule.event as any);

export const humanReadableEventBase = <T extends Event>(event: T, community: Communities) => {
	const rule = getRuleByName(event);

	if (typeof rule.display.base === "function") {
		return rule.display.base({ community });
	}

	return rule.display.base;
};

export const humanReadableEventHydrated = <T extends Event>(
	event: T,
	community: Communities,
	options: {
		rule: Rules;
		config?: (typeof rules)[T]["additionalConfig"] extends undefined
			? never
			: z.infer<NonNullable<(typeof rules)[T]["additionalConfig"]>>;
		sourceAction?: ActionInstances | null;
	}
) => {
	const ruleConf = getRuleByName(event);
	if (options.config && ruleConf.additionalConfig && ruleConf.display.hydrated) {
		return ruleConf.display.hydrated({ rule: options.rule, community, config: options.config });
	}
	if (options.sourceAction && isReferentialRule(ruleConf) && ruleConf.display.hydrated) {
		return ruleConf.display.hydrated({
			rule: options.rule,
			community,
			config: options.sourceAction,
		});
	}

	if (ruleConf.display.hydrated && !ruleConf.additionalConfig) {
		return ruleConf.display.hydrated({ rule: options.rule, community, config: {} as any });
	}

	if (typeof ruleConf.display.base === "function") {
		return ruleConf.display.base({ community });
	}

	return ruleConf.display.base;
};

export const humanReadableRule = <R extends Rules>(
	rule: R,
	community: Communities,
	instanceName: string,
	config?: (typeof rules)[R["event"]]["additionalConfig"] extends undefined
		? never
		: z.infer<NonNullable<(typeof rules)[R["event"]]["additionalConfig"]>>,
	sourceAction?: ActionInstances | null
) =>
	`${instanceName} will run when ${humanReadableEventHydrated(rule.event, community, { rule, config, sourceAction })}`;
