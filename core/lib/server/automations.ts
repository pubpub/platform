import type {
	ActionInstancesId,
	AutomationConditionBlocksId,
	AutomationConditionBlockType,
	AutomationConditionsId,
	AutomationEvent,
	Automations,
	AutomationsId,
	AutomationTriggersId,
	NewActionInstances,
	NewAutomations,
	NewAutomationTriggers,
} from "db/public"
import type { ZodError } from "zod"
import type { SequentialAutomationEvent } from "~/actions/types"
import type {
	ConditionBlockFormValue,
	ConditionFormValue,
} from "~/app/c/[communitySlug]/stages/manage/components/panel/actionsTab/ConditionBlock"

import { randomUUID } from "node:crypto"
import { sql } from "kysely"

import { expect } from "utils"

import { triggers } from "~/actions/_lib/triggers"
import { isSequentialAutomationEvent } from "~/actions/types"
import { db } from "~/kysely/database"
import { getAutomation } from "../db/queries"
import { findRanksBetween } from "../rank"
import { autoRevalidate } from "./cache/autoRevalidate"
import { maybeWithTrx } from "./maybeWithTrx"

export class AutomationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "AutomationError"
	}
}

export class AutomationConfigError extends AutomationError {
	constructor(
		public event: AutomationEvent,
		public config: Record<string, unknown>,
		public error: ZodError
	) {
		super(`Invalid config for ${event}: ${JSON.stringify(config)}. ${error.message}`)
		this.name = "AutomationConfigError"
	}
}

export class AutomationCycleError extends AutomationError {
	constructor(public path: Automations[]) {
		super(
			`Creating this automation would create a cycle: ${path.map((p) => p.name).join(" -> ")}`
		)
		this.name = "AutomationCycleError"
	}
}

export class AutomationMaxDepthError extends AutomationError {
	constructor(public path: Automations[]) {
		super(
			`Creating this automation would exceed the maximum stack depth (${MAX_STACK_DEPTH}): ${path.map((p) => p.name).join(" -> ")}`
		)
		this.name = "AutomationMaxDepthError"
	}
}

export class AutomationAlreadyExistsError extends AutomationError {
	constructor(
		message: string,
		public event: AutomationEvent,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId?: ActionInstancesId
	) {
		super(message)
		this.name = "AutomationAlreadyExistsError"
	}
}

export class SequentialAutomationAlreadyExistsError extends AutomationAlreadyExistsError {
	constructor(
		public event: SequentialAutomationEvent,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} automation for ${sourceActionInstanceId} running ${actionInstanceId} already exists`,
			event,
			actionInstanceId,
			sourceActionInstanceId
		)
	}
}

export class RegularAutomationAlreadyExistsError extends AutomationAlreadyExistsError {
	constructor(
		public event: AutomationEvent,
		public actionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} automation for ${actionInstanceId} already exists`,
			event,
			actionInstanceId
		)
	}
}

type AutomationUpsertProps = NewAutomations & {
	id?: AutomationsId
	condition?: ConditionBlockFormValue
	actionInstances: Omit<NewActionInstances, "automationId">[]
	triggers: Omit<NewAutomationTriggers, "automationId" | "id" | "createdAt" | "updatedAt">[]
}

// type FlatItem = (Omit<ConditionBlockFormValue, 'items'> | ConditionItemFormValue )

// type CorrectItem = FlatItem & {
// 	id: string;
// 	parentId?: string;
// }

type OutputItems = {
	blocks: (Omit<ConditionBlockFormValue, "items"> & {
		id: string
		parentId?: string
	})[]
	conditions: (ConditionFormValue & {
		id: string
		parentId?: string
	})[]
}

const getFlatBlocksAndConditions = (
	parentId: string,
	items: ConditionBlockFormValue["items"],
	accumulator: OutputItems
): OutputItems => {
	const ranks = findRanksBetween({ numberOfRanks: items.length })
	for (const [index, item] of items.entries()) {
		const rank = ranks[index]
		if (item.kind === "condition") {
			accumulator.conditions.push({
				...item,
				id: randomUUID(),
				parentId,
				rank: item.rank || rank, // makes it easy to seed,
			})

			continue
		}

		const { id: _, items: blockItems, ...blockWithoutItems } = item
		const blockId = randomUUID()
		accumulator.blocks.push({
			...blockWithoutItems,
			rank: blockWithoutItems.rank || rank,
			id: blockId,
			parentId,
		})

		if (blockItems.length > 0) {
			getFlatBlocksAndConditions(blockId, blockItems, accumulator)
		}
	}

	return accumulator
}

export const upsertAutomation = async (props: AutomationUpsertProps, trx = db) => {
	const res = await maybeWithTrx(trx, async (trx) => {
		const automation = await autoRevalidate(
			trx
				.insertInto("automations")
				.values({
					id: props.id ?? (randomUUID() as AutomationsId),
					name: props.name,
					description: props.description,
					icon: props.icon,
					communityId: props.communityId,
					stageId: props.stageId,
					conditionEvaluationTiming: props.conditionEvaluationTiming,
				})
				.onConflict((oc) =>
					oc.columns(["id"]).doUpdateSet((eb) => ({
						name: eb.ref("excluded.name"),
						description: eb.ref("excluded.description"),
						icon: eb.ref("excluded.icon"),
						communityId: eb.ref("excluded.communityId"),
						stageId: eb.ref("excluded.stageId"),
						conditionEvaluationTiming: eb.ref("excluded.conditionEvaluationTiming"),
					}))
				)
				.returningAll()
		).executeTakeFirstOrThrow()

		// delete existing triggers and recreate them
		await trx
			.deleteFrom("automation_triggers")
			.where("automationId", "=", automation.id)
			.execute()

		// insert new triggers
		if (props.triggers.length > 0) {
			await trx
				.insertInto("automation_triggers")
				.values(
					props.triggers.map((trigger) => ({
						id: randomUUID() as AutomationTriggersId,
						automationId: automation.id,
						event: trigger.event,
						config: trigger.config,
						sourceAutomationId: trigger.sourceAutomationId,
					}))
				)
				.execute()
		}

		// no man actionInstanceId's are important

		// insert the action instances
		await trx
			.insertInto("action_instances")
			.values(
				props.actionInstances.map((ai) => ({
					id: ai.id,
					automationId: automation.id,
					config: ai.config,
					action: ai.action,
				}))
			)
			.onConflict((oc) =>
				oc.columns(["id"]).doUpdateSet((eb) => ({
					config: eb.ref("excluded.config"),
					action: eb.ref("excluded.action"),
				}))
			)
			.execute()

		const actionInstancesWithIds = props.actionInstances
			.map((ai) => ai.id)
			.filter((aiId) => aiId !== undefined)

		if (actionInstancesWithIds.length > 0) {
			// delete the existing action instances that are not in the new action instances
			await trx
				.deleteFrom("action_instances")
				.where("automationId", "=", automation.id)
				.where("id", "not in", actionInstancesWithIds)
				.execute()
		}

		// delete all existing conditions/blocks, which should remove all conditions as well
		await trx
			.deleteFrom("automation_condition_blocks")
			.where("automationId", "=", automation.id)
			.execute()

		if (!props.condition) {
			return automation
		}

		// create new conditions/blocks
		const firstBlockId = randomUUID() as AutomationConditionBlocksId
		const firstBlock = {
			...props.condition,
			id: firstBlockId,
			parentId: undefined,
		}

		const flatItems = getFlatBlocksAndConditions(firstBlockId, props.condition.items, {
			blocks: [firstBlock],
			conditions: [],
		})

		// create all block
		await trx
			.insertInto("automation_condition_blocks")
			.values(
				flatItems.blocks.map((block) => ({
					type: block.type as AutomationConditionBlockType,
					rank: block.rank,
					automationConditionBlockId: (block.parentId ??
						null) as AutomationConditionBlocksId | null,
					id: block.id as AutomationConditionBlocksId,
					automationId: automation.id,
				}))
			)
			.execute()

		if (flatItems.conditions.length > 0) {
			await trx
				.insertInto("automation_conditions")
				.values(
					flatItems.conditions.map((condition) => ({
						rank: condition.rank,
						type: condition.type,
						expression: condition.expression,
						id: condition.id as AutomationConditionsId,
						automationConditionBlockId:
							condition.parentId as AutomationConditionBlocksId,
					}))
				)
				.execute()
		}

		return automation
	})

	return res
}

export const removeAutomation = (automationId: AutomationsId) =>
	autoRevalidate(db.deleteFrom("automations").where("id", "=", automationId))

export const duplicateAutomation = async (automationId: AutomationsId) => {
	const automation = await getAutomation(automationId)
	if (!automation) {
		throw new Error(`Automation ${automationId} not found`)
	}
	const copyNumberMatch = automation.name.match(/\(Copy (\d+)/)
	const nextCopyNumber = copyNumberMatch
		? Number.isNaN(parseInt(copyNumberMatch[1]))
			? 1
			: parseInt(copyNumberMatch[1]) + 1
		: 0
	const copyName =
		nextCopyNumber > 0
			? `${automation.name} (Copy ${nextCopyNumber})`
			: `${automation.name} (Copy)`

	// const newAutomationId = randomUUID() as AutomationsId
	const newAutomation = await upsertAutomationWithCycleCheck({
		actionInstances: automation.actionInstances.map(({ id, automationId, ...ai }) => ai),
		communityId: automation.communityId,
		name: copyName,
		triggers: automation.triggers.map(({ id, automationId, ...trigger }) => trigger),
		condition: automation.condition ?? undefined,
		conditionEvaluationTiming: automation.conditionEvaluationTiming,
		icon: automation.icon,
		description: automation.description,
		stageId: automation.stageId,
	})

	return newAutomation
}

/**
 * The maximum number of automations that can be in a sequence in a single stage.
 * TODO: make this trackable across stages
 */
export const MAX_STACK_DEPTH = 10

/**
 * checks if adding an automation would create a cycle, or else adding it would create
 * a sequence exceeding the MAXIMUM_STACK_DEPTH
 *
 * now queries automation_triggers to find chaining relationships
 */
async function wouldCreateCycle(
	toBeRunAutomationId: AutomationsId,
	sourceAutomationId: AutomationsId,
	maxStackDepth = MAX_STACK_DEPTH
): Promise<
	| { hasCycle: true; exceedsMaxDepth: false; path: Automations[] }
	| { hasCycle: false; exceedsMaxDepth: true; path: Automations[] }
	| { hasCycle: false; exceedsMaxDepth: false; path?: never }
> {
	// check if there's a path from toBeRunAutomationId back to sourceAutomationId (cycle)
	// or if any path would exceed MAX_STACK_DEPTH
	const result = await db
		.withRecursive("automation_path", (cte) =>
			cte
				.selectFrom("automations")
				.select([
					"id",
					sql<AutomationsId[]>`array[id]`.as("path"),
					sql<number>`1`.as("depth"),
					sql<boolean>`false`.as("isCycle"),
				])
				.where("id", "=", toBeRunAutomationId)
				.union((qb) =>
					qb
						.selectFrom("automation_path")
						.innerJoin(
							"automation_triggers",
							"automation_triggers.sourceAutomationId",
							"automation_path.id"
						)
						.innerJoin(
							"automations",
							"automations.id",
							"automation_triggers.automationId"
						)
						.select([
							"automations.id",
							sql<AutomationsId[]>`automation_path.path || array[automations.id]`.as(
								"path"
							),
							sql<number>`automation_path.depth + 1`.as("depth"),
							sql<boolean>`automations.id = any(automation_path.path) OR automations.id = ${sourceAutomationId}`.as(
								"isCycle"
							),
						])
						.where((eb) =>
							// continue recursion if:
							// 1. we haven't found a cycle yet
							// 2. we haven't exceeded MAX_STACK_DEPTH
							eb.and([
								eb("automation_path.isCycle", "=", false),
								eb("automation_path.depth", "<=", maxStackDepth),
							])
						)
				)
		)
		.selectFrom("automation_path")
		.select(["id", "path", "depth", "isCycle"])
		.where((eb) =>
			// find either:
			// 1. a path that creates a cycle (id = sourceAutomationId or id already in path)
			// 2. a path that would exceed MAX_STACK_DEPTH when adding the new automation
			eb.or([eb("isCycle", "=", true), eb("depth", ">=", maxStackDepth)])
		)
		.orderBy(["isCycle desc", "depth desc"])
		.limit(1)
		.execute()

	if (result.length === 0) {
		return {
			hasCycle: false,
			exceedsMaxDepth: false,
		}
	}

	const pathResult = result[0]

	const fullPath = [sourceAutomationId, toBeRunAutomationId, ...pathResult.path]

	// get the automations for the path
	const automations = await db
		.selectFrom("automations")
		.selectAll()
		.where("id", "in", fullPath)
		.execute()

	const filledInPath = fullPath.map((id) => {
		const automation = expect(
			automations.find((a) => a.id === id),
			`Automation ${id} not found`
		)
		return automation
	})

	return {
		hasCycle: pathResult.isCycle,
		exceedsMaxDepth: !pathResult.isCycle && pathResult.depth >= maxStackDepth,
		path: filledInPath,
	} as
		| {
				hasCycle: true
				exceedsMaxDepth: false
				path: Automations[]
		  }
		| {
				hasCycle: false
				exceedsMaxDepth: true
				path: Automations[]
		  }
}

export async function upsertAutomationWithCycleCheck(
	data: AutomationUpsertProps & {
		id?: AutomationsId
	},
	maxStackDepth = MAX_STACK_DEPTH
) {
	// validate trigger configs
	for (const trigger of data.triggers) {
		const additionalConfigSchema = triggers[trigger.event].config
		if (additionalConfigSchema && trigger.config) {
			try {
				additionalConfigSchema.parse(trigger.config)
			} catch (e) {
				throw new AutomationConfigError(
					trigger.event,
					trigger.config as Record<string, unknown>,
					e
				)
			}
		}
	}

	// check for cycles if any trigger is a chaining event with a source automation
	const chainingTriggers = data.triggers.filter(
		(t) => isSequentialAutomationEvent(t.event) && t.sourceAutomationId
	)

	if (chainingTriggers.length > 0 && data.id) {
		for (const trigger of chainingTriggers) {
			if (!trigger.sourceAutomationId) continue

			const result = await wouldCreateCycle(
				data.id,
				trigger.sourceAutomationId,
				maxStackDepth
			)

			if (result.hasCycle) {
				throw new AutomationCycleError(result.path)
			}

			if ("exceedsMaxDepth" in result && result.exceedsMaxDepth) {
				throw new AutomationMaxDepthError(result.path)
			}
		}
	}

	const res = await upsertAutomation(data)
	return res
}
