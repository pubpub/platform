/**
 * exploration of reusable kysely subquery patterns with proper output types
 *
 * the goal: define helper functions that can add selections to any query
 * while preserving type safety on the output, without caring too much about
 * the exact shape of the input query builder.
 */

import type { ActionInstances, Automations, AutomationTriggers, PublicSchema } from "db/public"
import type { ExpressionBuilder, Selectable, SelectQueryBuilder } from "kysely"

import { jsonArrayFrom } from "kysely/helpers/postgres"

import { db } from "~/kysely/database"

// the output types we want from our subqueries
type AutomationBase = Selectable<Automations>
type AutomationWithRelations = AutomationBase & {
	triggers: Selectable<AutomationTriggers>[]
	actionInstances: Selectable<ActionInstances>[]
}

// approach 1: fully generic, works with any query that has access to "stages" table
// the trick is: we don't constrain TB, we just need DB to have the tables we need
type HasRequiredTables = PublicSchema // or a subset with just the tables we need

export const withAutomationsGeneric = <DB extends HasRequiredTables, TB extends keyof DB, O>(
	qb: SelectQueryBuilder<DB, TB, O>
) => {
	// the cast to `any` here is necessary because kysely can't know that
	// "stages" is in TB, even though we need it to be for whereRef to work.
	// this is the tradeoff: lose type safety inside, gain it on the output.
	return (qb as SelectQueryBuilder<any, any, O>).select((eb: ExpressionBuilder<any, any>) =>
		jsonArrayFrom(
			eb
				.selectFrom("automations")
				.whereRef("automations.stageId", "=", "stages.id")
				.selectAll("automations")
		).as("automations")
	)
}
const _result1 = (
	await db
		.selectFrom("stages")
		.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
		.select("stages.id")
		.$if(true, (qb) => withAutomationsGeneric(qb))
		.executeTakeFirstOrThrow()
).automations
// ^?

// approach 2: callback style - let the caller handle the eb, we just define the subquery builder
// this is more composable and avoids the need for internal any casts
export const buildAutomationsSubquery = (eb: ExpressionBuilder<PublicSchema, "stages">) =>
	jsonArrayFrom(
		eb
			.selectFrom("automations")
			.whereRef("automations.stageId", "=", "stages.id")
			.selectAll("automations")
	).as("automations")

const _result2 = (
	await db
		.selectFrom("stages")
		.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
		.select("stages.id")
		.$if(true, (qb) => qb.select(buildAutomationsSubquery))
		.executeTakeFirstOrThrow()
).automations
// ^?

// approach 3: the pattern kysely's $if uses - accept any, return with typed output
// this works because $if already expects SelectQueryBuilder<any, any, O & O2>
export const addAutomationsSelection = <EB extends ExpressionBuilder<PublicSchema, "stages">>(
	eb: EB
) => {
	// the explicit cast is needed because `any` types cause selectAll to lose type info
	return jsonArrayFrom(
		eb
			.selectFrom("automations")
			.whereRef("automations.stageId", "=", "stages.id")
			.selectAll("automations")
	).as("automations")
}

const _result3 = (
	await db
		.selectFrom("stages")
		.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
		.select("stages.id")
		.$if(9 + 4 === 13, (qb) => qb.select((eb) => addAutomationsSelection(eb)))
		.executeTakeFirstOrThrow()
).automations
// ^?

// approach 4: using a type parameter for the output type, with a constraint on the input
// this gives you the best of both worlds: type safety on input (requires stages) and output
type RequiresStagesTable = {
	stages: PublicSchema["stages"]
	automations: PublicSchema["automations"]
}

export const withAutomationsConstrained = <
	DB extends RequiresStagesTable,
	TB extends keyof DB & string,
	O,
>(
	qb: SelectQueryBuilder<DB, TB, O>
) => {
	// still need the cast, but the constraint ensures the tables exist
	const builder = qb as unknown as SelectQueryBuilder<PublicSchema, "stages", O>
	return builder.select((eb) =>
		jsonArrayFrom(
			eb
				.selectFrom("automations")
				.whereRef("automations.stageId", "=", "stages.id")
				.selectAll("automations")
		).as("automations")
	)
}
const _result4 = (
	await db
		.selectFrom("stages")
		.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
		.select("stages.id")
		.$if(true, (qb) => withAutomationsConstrained(qb))
		.executeTakeFirstOrThrow()
).automations
// ^?

// approach 5: "builder factory" pattern - return a function that can be used with $call
// this is nice because $call preserves types naturally
export const automationsSelector =
	() =>
	<DB, TB extends keyof DB, O>(qb: SelectQueryBuilder<DB, TB, O>) => {
		return (qb as SelectQueryBuilder<any, any, O>).select((eb: ExpressionBuilder<any, any>) =>
			jsonArrayFrom(
				eb
					.selectFrom("automations")
					.whereRef("automations.stageId", "=", "stages.id")
					.selectAll("automations")
			).as("automations")
		)
	}

// example usage showing how each approach would be used:
/*
import { db } from "~/kysely/database"

// approach 1: generic function
const result1 = await withAutomationsGeneric(
	db.selectFrom("stages").select("stages.id")
).execute()
// result1 type: { id: string; automations: AutomationBase[] }[]

// approach 2: callback in select
const result2 = await db
	.selectFrom("stages")
	.select(["stages.id", buildAutomationsSubquery])
	.execute()
// this doesn't quite work because select expects a different shape

// approach 3: works well with $if
const result3 = await db
	.selectFrom("stages")
	.select("stages.id")
	.$if(true, addAutomationsSelection)
	.execute()
// result3 type: { id: string; automations?: AutomationBase[] }[]

// approach 5: $call
const result5 = await db
	.selectFrom("stages")
	.select("stages.id")
	.$call(automationsSelector())
	.execute()
// result5 type: { id: string; automations: AutomationBase[] }[]
*/

// the most practical pattern for your use case:
// define a helper type and function that works with $if's expectations

type AutomationOutput<Detail extends "base" | "full"> = Detail extends "full"
	? AutomationWithRelations
	: AutomationBase

// this is the cleanest version i can come up with
// note: we use function overloads to get proper return types based on the detail parameter
export function selectAutomations<O>(
	qb: SelectQueryBuilder<any, any, O>,
	detail: "base"
): SelectQueryBuilder<any, any, O & { automations: AutomationBase[] }>
export function selectAutomations<O>(
	qb: SelectQueryBuilder<any, any, O>,
	detail: "full"
): SelectQueryBuilder<any, any, O & { automations: AutomationWithRelations[] }>
export function selectAutomations<O>(
	qb: SelectQueryBuilder<any, any, O>,
	detail: "base" | "full"
): SelectQueryBuilder<any, any, O & { automations: (AutomationBase | AutomationWithRelations)[] }> {
	if (detail === "base") {
		return qb.select((eb: ExpressionBuilder<any, any>) =>
			jsonArrayFrom(
				eb
					.selectFrom("automations")
					.whereRef("automations.stageId", "=", "stages.id")
					.selectAll("automations")
			).as("automations")
		) as SelectQueryBuilder<any, any, O & { automations: AutomationBase[] }>
	}

	return qb.select((eb: ExpressionBuilder<any, any>) =>
		jsonArrayFrom(
			eb
				.selectFrom("automations")
				.whereRef("automations.stageId", "=", "stages.id")
				.selectAll("automations")
				.select([
					jsonArrayFrom(
						eb
							.selectFrom("automation_triggers")
							.selectAll("automation_triggers")
							.whereRef("automation_triggers.automationId", "=", "automations.id")
					)
						.$notNull()
						.as("triggers"),
					jsonArrayFrom(
						eb
							.selectFrom("action_instances")
							.selectAll("action_instances")
							.whereRef("action_instances.automationId", "=", "automations.id")
					)
						.$notNull()
						.as("actionInstances"),
				])
		).as("automations")
	) as SelectQueryBuilder<any, any, O & { automations: AutomationWithRelations[] }>
}

const _result5 = (
	await db
		.selectFrom("stages")
		.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
		.select("stages.id")
		.$if(true, (qb) => selectAutomations(qb, "full"))
		.executeTakeFirstOrThrow()
).automations
// ^?
