import { interpolate } from "@pubpub/json-interpolate";
import { AutomationConditionBlockType } from "db/public";

import type { ConditionBlock } from "~/lib/db/queries";

type ConditionItem = ConditionBlock["items"][number];
type Condition = Extract<ConditionItem, { kind: "condition" }>;

// collect all conditions from the tree
const collectConditions = (block: ConditionBlock): Condition[] => {
	const conditions: Condition[] = [];

	for (const item of block.items) {
		if (item.kind === "condition") {
			conditions.push(item);
		} else {
			conditions.push(...collectConditions(item));
		}
	}

	return conditions;
};

// evaluate a block using pre-computed condition results
const evaluateBlockWithResults = (
	block: ConditionBlock,
	resultMap: Map<string, boolean>
): boolean => {
	const { type, items } = block;

	if (items.length === 0) {
		return true;
	}

	const itemResults = items.map((item) => {
		if (item.kind === "condition") {
			return resultMap.get(item.id) ?? false;
		}
		return evaluateBlockWithResults(item, resultMap);
	});

	if (type === AutomationConditionBlockType.AND) {
		return itemResults.every((result) => result);
	}

	if (type === AutomationConditionBlockType.OR) {
		return itemResults.some((result) => result);
	}

	if (type === AutomationConditionBlockType.NOT) {
		if (itemResults.length !== 1) {
			return false;
		}
		return !itemResults[0];
	}

	return false;
};

export const evaluateConditions = async (
	conditions: ConditionBlock,
	data: unknown
): Promise<boolean> => {
	// collect all conditions across all nesting levels
	const allConditions = collectConditions(conditions);

	// evaluate all jsonata expressions in parallel
	const evaluationPromises = allConditions.map(async (condition) => {
		if (condition.type !== "jsonata") {
			return { id: condition.id, result: false };
		}

		const result = await interpolate(condition.expression, data);
		return { id: condition.id, result: !!result };
	});

	const evaluatedResults = await Promise.all(evaluationPromises);

	// build result map
	const resultMap = new Map<string, boolean>();
	for (const { id, result } of evaluatedResults) {
		resultMap.set(id, result);
	}

	// evaluate the block structure with pre-computed results
	return evaluateBlockWithResults(conditions, resultMap);
};
