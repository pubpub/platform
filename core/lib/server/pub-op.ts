import type { Kysely, Transaction } from "kysely";

import { sql } from "kysely";
import pMap from "p-map";

import type { JsonValue, ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId, StagesId } from "db/public";
import type { LastModifiedBy } from "db/types";
import { logger } from "logger";
import { assert, expect } from "utils";
import { isUuid } from "utils/uuid";

import { db } from "~/kysely/database";
import { autoRevalidate } from "./cache/autoRevalidate";
import { maybeWithTrx } from "./maybeWithTrx";
import {
	deletePub,
	deletePubValuesByValueId,
	getPubsWithRelatedValues,
	upsertPubRelationValues,
	upsertPubValues,
	validatePubValues,
} from "./pub";

type PubValue = string | number | boolean | JsonValue | Date;

type PubOpOptionsBase = {
	communityId: CommunitiesId;
	lastModifiedBy: LastModifiedBy;
	trx?: Kysely<Database>;
	target?: PubsId | { slug: string; value: PubValue };
};

type PubOpOptionsCreateUpsert = PubOpOptionsBase & {
	pubTypeId: PubTypesId;
	continueOnValidationError?: boolean;
};

type PubOpOptionsUpdate = PubOpOptionsBase & {
	continueOnValidationError?: boolean;
	pubTypeId?: never;
};

type PubOpOptions = PubOpOptionsCreateUpsert | PubOpOptionsUpdate;

type SetOptions = {
	/**
	 * if this is not `false` for all `set` commands,
	 * all non-updating non-relation values will be deleted.
	 *
	 * @default true for `upsert`
	 * @default false for `update`.
	 *
	 * Does not have an effect for `create`.
	 *
	 * eg, here all non-updating non-relation values will be deleted, because at least one value has `deleteExistingValues: true`
	 * ```ts
	 * // before
	 * // title: "old title"
	 * // description: "old description"
	 * // publishedAt: "2024-01-01"
	 *
	 * PubOp.update(id, { } )
	 * 		.set("title", "new title", { deleteExistingValues: true })
	 * 		.set("description", "new description")
	 * 		.execute();
	 *
	 * // after
	 * // title: "new title"
	 * // description: "new description"
	 * // -- no publishedAt value, because it was deleted
	 * ```
	 *
	 * The converse holds true for for `upsert`: by default we act as if `deleteExistingValues: true` for all `set` commands.
	 * ```ts
	 * // before
	 * // title: "old title"
	 * // description: "old description"
	 * // publishedAt: "2024-01-01"
	 *
	 * PubOp.upsert(id, { } )
	 * 		.set("title", "new title")
	 * 		.set("description", "new description")
	 * 		.execute();
	 *
	 * // after
	 * // title: "new title"
	 * // description: "new description"
	 * // -- no publishedAt value, because it was deleted
	 * ```
	 *
	 * to opt out of this behavior on `upsert`, you need to explicitly set `{ deleteExistingValues: false }` for all `set` commands you pass
	 * ```ts
	 * // before
	 * // title: "old title"
	 * // description: "old description"
	 * // publishedAt: "2024-01-01"
	 *
	 * PubOp.upsert(id, { } )
	 * 		.set("title", "new title", { deleteExistingValues: false })
	 * 		.set("description", "new description", { deleteExistingValues: false })
	 * 		.execute();
	 *
	 * // OR
	 * PubOp.upsert(id, { } )
	 * 		.set({
	 * 			title: "new title",
	 * 			description: "new description",
	 * 		}, { deleteExistingValues: false })
	 * 		.execute();
	 *
	 * // after
	 * // title: "new title"
	 * // description: "new description"
	 * // publishedAt: "2024-01-01" -- not deleted, because `deleteExistingValues` is false for all
	 * ```
	 */
	deleteExistingValues?: boolean;

	/**
	 * If true, nullish values will not be set.
	 */
	ignoreNullish?: boolean;
};

type RelationOptions = {
	/**
	 * If true, existing relations on the _same_ field will be removed
	 *
	 * Pubs these relations are pointing to will not be removed unless `deleteOrphaned` is also true
	 *
	 * @default true for `upsert`
	 * @default false for `update` and `create`
	 */
	replaceExisting?: boolean;
	/**
	 * If true, pubs that have been disconnected and all their descendants that are not otherwise connected
	 * will be deleted.
	 *
	 * Does not do anything unless `replaceExisting` is also true
	 *
	 * @default false
	 */
	deleteOrphaned?: boolean;
};

// Base commands that will be used internally
type SetCommand = { type: "set"; slug: string; value: PubValue | undefined; options?: SetOptions };
type RelateCommand = {
	type: "relate";
	slug: string;
	relations: Array<{ target: ActivePubOp | PubsId; value: PubValue }>;
	options: RelationOptions;
};
type RelateByValueCommand = {
	type: "relateByValue";
	slug: string;
	relations: Array<{ target: { slug: string; value: PubValue }; value: PubValue }>;
	options: RelationOptions;
};

type UnrelateCommand = {
	type: "unrelate";
	slug: (string & {}) | "*";
	target: PubsId | "*";
	options?: {
		/**
		 * If true, pubs that have been disconnected and all their descendants that are not otherwise connected
		 * will be deleted.
		 */
		deleteOrphaned?: boolean;
	};
};
type UnrelateByValueCommand = {
	type: "unrelateByValue";
	slug: string;
	relations: Array<{ target: { slug: string; value: PubValue }; value: PubValue }>;
	options?: {
		/**
		 * If true, pubs that have been disconnected and all their descendants that are not otherwise connected
		 * will be deleted.
		 */
		deleteOrphaned?: boolean;
	};
};

type UnsetCommand = {
	type: "unset";
	slug: string;
};

type SetStageCommand = {
	type: "setStage";
	stage: StagesId | null;
};

type PubOpCommand =
	| SetCommand
	| RelateCommand
	| UnrelateCommand
	| UnsetCommand
	| SetStageCommand
	| RelateByValueCommand
	| UnrelateByValueCommand;

type ClearRelationOperation = {
	type: "clear";
	slug: string;
	options?: Omit<RelationOptions, "replaceExisting">;
};

type RemoveRelationOperation = {
	type: "remove";
	slug: string;
	target: PubsId;
	options?: Omit<RelationOptions, "replaceExisting">;
};

type OverrideRelationOperation = {
	type: "override";
	slug: string;
	options?: RelationOptions;
};

type RelationOperation =
	| ClearRelationOperation
	| RemoveRelationOperation
	| OverrideRelationOperation;

// Types for operation collection
type OperationMode = "create" | "upsert" | "update";

interface CollectedOperationBase {
	target: PubsId | ValueTarget;
	values: Array<{ slug: string; value: PubValue; options?: SetOptions }>;
	relationsToAdd: Array<{
		slug: string;
		value: PubValue;
		target: PubsId | ValueTarget;
		options: RelationOptions;
	}>;
	relationsToRemove: Array<{
		slug: string;
		target: PubsId | ValueTarget;
		options?: Omit<RelationOptions, "replaceExisting">;
	}>;
	relationsToClear: Array<{
		slug: string | "*";
		options?: Omit<RelationOptions, "replaceExisting">;
	}>;
	/**
	 * null meaning no stage
	 */
	stage?: StagesId | null;
}

type CreateOrUpsertOperation = CollectedOperationBase & {
	mode: "upsert" | "create";
	pubTypeId: PubTypesId;
};
type UpdateOperation = CollectedOperationBase & {
	mode: "update";
	/**
	 * you cannot update the pubTypeId of an existing pub
	 */
	pubTypeId?: never;
};

type CollectedOperation = CreateOrUpsertOperation | UpdateOperation;

type ValueTarget = { slug: string; value: PubValue };

type OperationsMap = Map<PubsId | ValueTarget, CreateOrUpsertOperation | UpdateOperation>;

type PubOpErrorCode =
	| "RELATION_CYCLE"
	| "ORPHAN_CONFLICT"
	| "VALIDATION_ERROR"
	| "INVALID_TARGET"
	| "CREATE_EXISTING"
	| "AMBIGUOUS_TARGET"
	| "UNKNOWN";

export class PubOpError extends Error {
	readonly code: PubOpErrorCode;
	constructor(code: PubOpErrorCode, message: string) {
		super(message);
		this.name = "PubOpError";
		this.code = code;
	}
}

/**
 * Could be useful if we want to disallow the creation of cycles
 */
class PubOpRelationCycleError extends PubOpError {
	constructor(message: string) {
		super("RELATION_CYCLE", `Relation cycle detected: ${message}`);
	}
}

class PubOpValidationError extends PubOpError {
	constructor(message: string) {
		super("VALIDATION_ERROR", `Validation error: ${message}`);
	}
}

class PubOpInvalidTargetError extends PubOpError {
	constructor(relation: string, target: string, message?: string) {
		super(
			"INVALID_TARGET",
			`Invalid target for relation \`${relation}\`: \`${target}\` ${message ?? ""}`
		);
	}
}

class PubOpCreateExistingError extends PubOpError {
	constructor(pubId: PubsId) {
		super("CREATE_EXISTING", `Cannot create a pub with an id that already exists: ${pubId}`);
	}
}

class PubOpUnknownError extends PubOpError {
	constructor(message: string) {
		super("UNKNOWN", message);
	}
}

function isPubId(val: string | PubsId): val is PubsId {
	return isUuid(val);
}

// Add this class to handle nested pub operations
class NestedPubOpBuilder {
	constructor(private readonly parentOptions: PubOpOptionsBase) {}

	create(options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }): CreatePubOp {
		return new CreatePubOp({
			...this.parentOptions,
			...options,
		});
	}

	createWithId(
		id: PubsId,
		options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }
	): CreatePubOp {
		return new CreatePubOp(
			{
				...this.parentOptions,
				...options,
			},
			id
		);
	}

	update(id: PubsId, options: Partial<PubOpOptionsBase> = {}): UpdatePubOp {
		return new UpdatePubOp(
			{
				...this.parentOptions,
				...options,
			},
			id
		);
	}

	upsert(
		id: PubsId,
		options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
	): UpsertPubOp {
		return new UpsertPubOp(
			{
				...this.parentOptions,
				...options,
			},
			id
		);
	}

	upsertByValue(
		slug: string,
		value: PubValue,
		options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
	): UpsertPubOp {
		return new UpsertPubOp(
			{
				...this.parentOptions,
				...options,
			},
			{ slug, value }
		);
	}
}

interface UpdateOnlyOps {
	unset(slug: string): this;
	unrelate(slug: string, target: PubsId, options?: { deleteOrphaned?: boolean }): this;
}

export type PubOpCreate = CreatePubOp;
export type PubOpUpdate = UpdatePubOp;
export type PubOpUpsert = UpsertPubOp;

export type PubOpBatch = BatchPubOp;

export type ActivePubOp = PubOpCreate | PubOpUpdate | PubOpUpsert;

/**
 * Helper function to access the protected collectOperations method on ActivePubOp
 */
function collectOperationsFromPubOp(
	op: ActivePubOp,
	processed: Set<PubsId | ValueTarget>
): OperationsMap {
	// We need to access the protected method on SinglePubOp
	// Since TypeScript doesn't allow direct access to protected methods from outside the class hierarchy,
	// we're using the fact that the method exists on the object
	return (op as any).collectOperations(processed);
}

/**
 * Base class for all pub operations (both single and batch)
 * Contains shared functionality for executing operations
 */
abstract class PubOpBase {
	/**
	 * Execute operations with a transaction
	 */
	protected abstract executeWithTrx(trx: Transaction<Database>): Promise<PubsId | PubsId[]>;

	/**
	 * Resolve a target to a pub ID
	 */
	protected resolveTargetId(
		target: PubsId | ValueTarget,
		targetMap: Map<ValueTarget, PubsId>
	): PubsId {
		if (typeof target === "string" && isPubId(target)) {
			return target;
		}

		const id = targetMap.get(target as ValueTarget);
		if (!id) {
			throw new PubOpError(
				"UNKNOWN",
				`Target ${JSON.stringify(target)} not found in target map. This is likely a bug.`
			);
		}

		return id;
	}

	/**
	 * Resolve all non-ID targets to pub IDs
	 */
	protected async resolveAllNonIdTargets(
		trx: Kysely<Database>,
		operations: OperationsMap,
		targetMap: Map<ValueTarget, PubsId>,
		communityId: CommunitiesId
	): Promise<void> {
		const valueTargets = Array.from(operations.keys()).filter(
			(key) => typeof key !== "string"
		) as ValueTarget[];

		const relationTargets = Array.from(operations.values()).flatMap((op) =>
			[...op.relationsToAdd, ...op.relationsToRemove]
				.filter((r) => typeof r.target !== "string")
				.map((r) => r.target as ValueTarget)
		);

		// combine and deduplicate targets
		const allValueTargets = [...new Set([...valueTargets, ...relationTargets])];

		if (allValueTargets.length === 0) {
			return;
		}

		// group targets by slug for a more efficient query
		const targetsBySlug = new Map<string, { value: PubValue; target: ValueTarget }[]>();
		for (const target of allValueTargets) {
			const existing = targetsBySlug.get(target.slug) || [];
			existing.push({ value: target.value, target });
			targetsBySlug.set(target.slug, existing);
		}

		// build a single query to fetch all matching pubs
		// definitely not worth caching this
		const query = trx
			.selectFrom("pub_fields")
			.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
			.innerJoin("pubs", "pubs.id", "pub_values.pubId")
			.select((eb) => [
				"pub_fields.slug as slug",
				"pub_values.value as value",
				"pubs.id as pubId",
				"pubs.communityId as communityId",
			])
			.where("pubs.communityId", "=", communityId)
			.where((eb) =>
				eb.or(
					Array.from(targetsBySlug.entries()).map(([slug, values]) =>
						eb.and([
							eb("pub_fields.slug", "=", slug),
							eb(
								sql`${JSON.stringify(
									targetsBySlug
										.values()
										.toArray()[0]
										.map((v) => v.value)
								)}::jsonb`,
								"@>",
								eb.ref("pub_values.value")
							),
						])
					)
				)
			);

		const results = await query.execute();

		// create a lookup map to match results back to targets
		const resultMap = new Map<string, PubsId[]>();
		for (const result of results) {
			const key = `${result.slug}:${JSON.stringify(result.value)}`;
			const existing = resultMap.get(key) || [];
			existing.push(result.pubId as PubsId);
			resultMap.set(key, existing);
		}

		// process each original target and populate targetMap
		for (const target of allValueTargets) {
			const key = `${target.slug}:${JSON.stringify(target.value)}`;
			const pubIds = resultMap.get(key) || [];

			if (pubIds.length > 1) {
				throw new PubOpError(
					"AMBIGUOUS_TARGET",
					`Multiple pubs found for target: ${target.slug} = ${target.value}.\n Pub 1: ${pubIds[0]}\n Pub 2: ${pubIds[1]}`
				);
			}

			const fallbackOnNotFound = operations.get(target)?.mode === "upsert";

			if (pubIds.length === 0 && !fallbackOnNotFound) {
				throw new PubOpError(
					"INVALID_TARGET",
					`No pub found for target: ${target.slug} = ${target.value}`
				);
			}

			if (pubIds.length === 1) {
				targetMap.set(target, pubIds[0]);
			}
		}
	}

	/**
	 * Create all pubs described in the operations map
	 */
	protected async createAllPubs(
		trx: Transaction<Database>,
		operations: OperationsMap,
		targetMap: Map<ValueTarget, PubsId>,
		communityId: CommunitiesId,
		isStrict = false
	): Promise<void> {
		const createOrUpsertOperations = Array.from(operations.entries()).filter(
			([_, operation]) => operation.mode === "create" || operation.mode === "upsert"
		);

		if (createOrUpsertOperations.length === 0) {
			return;
		}

		const pubsToCreate = createOrUpsertOperations.map(([key, operation]) => ({
			id: this.resolveTargetId(key, targetMap),
			communityId,
			pubTypeId: expect(operation.pubTypeId),
		}));

		const createdPubs = await autoRevalidate(
			trx
				.insertInto("pubs")
				.values(pubsToCreate)
				.onConflict((oc) => oc.columns(["id"]).doNothing())
				.returningAll()
		).execute();

		// For strict mode (used in single pub operations), check for create conflicts
		if (isStrict) {
			createOrUpsertOperations.forEach(([key, op], index) => {
				const createdPub = createdPubs[index];
				const pubToCreate = pubsToCreate[index];

				if (pubToCreate.id && pubToCreate.id !== createdPub?.id && op.mode === "create") {
					throw new PubOpCreateExistingError(pubToCreate.id);
				}
			});
		}
	}

	/**
	 * Process stages for all pubs in the operations map
	 */
	protected async processStages(
		trx: Transaction<Database>,
		operations: OperationsMap,
		targetMap: Map<ValueTarget, PubsId>
	): Promise<void> {
		const stagesToUpdate = Array.from(operations.entries())
			.filter(([_, op]) => op.stage !== undefined)
			.map(([target, op]) => ({
				pubId: this.resolveTargetId(target, targetMap),
				stageId: op.stage!,
			}));

		if (stagesToUpdate.length === 0) {
			return;
		}

		const nullStages = stagesToUpdate.filter(({ stageId }) => stageId === null);

		if (nullStages.length > 0) {
			await autoRevalidate(
				trx.deleteFrom("PubsInStages").where(
					"pubId",
					"in",
					nullStages.map(({ pubId }) => pubId)
				)
			).execute();
		}

		const nonNullStages = stagesToUpdate.filter(({ stageId }) => stageId !== null);

		if (nonNullStages.length > 0) {
			await autoRevalidate(
				trx
					.with("deletedStages", (db) =>
						db
							.deleteFrom("PubsInStages")
							.where((eb) =>
								eb.or(
									nonNullStages.map((stageOp) => eb("pubId", "=", stageOp.pubId))
								)
							)
					)
					.insertInto("PubsInStages")
					.values(
						nonNullStages.map((stageOp) => ({
							pubId: stageOp.pubId,
							stageId: stageOp.stageId,
						}))
					)
			).execute();
		}
	}

	/**
	 * Process relations for all pubs in the operations map
	 */
	protected async processRelations(
		trx: Transaction<Database>,
		operations: OperationsMap,
		targetMap: Map<ValueTarget, PubsId>,
		lastModifiedBy: LastModifiedBy,
		communityId: CommunitiesId
	): Promise<void> {
		const relationsToCheckForOrphans = new Set<PubsId>();

		for (const [pubTarget, op] of operations) {
			const allOps = [
				...op.relationsToAdd
					.filter((r) => r.options.replaceExisting)
					.map((r) => ({ type: "override", ...r })),
				...op.relationsToClear.map((r) => ({ type: "clear", ...r })),
				...op.relationsToRemove.map((r) => ({ type: "remove", ...r })),
			] as RelationOperation[];

			if (allOps.length === 0) {
				continue;
			}

			const pubId = this.resolveTargetId(pubTarget, targetMap);

			// Find all existing relations that might be affected
			const existingRelations = await trx
				.selectFrom("pub_values")
				.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
				.select(["pub_values.id", "relatedPubId", "pub_fields.slug"])
				.where("pubId", "=", pubId)
				.where("relatedPubId", "is not", null)
				.where(
					"slug",
					"in",
					allOps.map((op) => op.slug)
				)
				.$narrowType<{ relatedPubId: PubsId }>()
				.execute();

			// Determine which relations to delete
			const relationsToDelete = existingRelations.filter((relation) => {
				return allOps.some((relationOp) => {
					if (relationOp.slug !== relation.slug) {
						return false;
					}

					switch (relationOp.type) {
						case "clear":
							return true;
						case "remove":
							return relationOp.target === relation.relatedPubId;
						case "override":
							return true;
					}
				});
			});

			if (relationsToDelete.length === 0) {
				continue;
			}
			// delete the relation values only
			await deletePubValuesByValueId({
				pubId,
				valueIds: relationsToDelete.map((r) => r.id),
				lastModifiedBy,
				trx,
			});

			// check which relations should also be removed due to being orphaned
			const possiblyOrphanedRelations = relationsToDelete.filter((relation) => {
				return allOps.some((relationOp) => {
					if (relationOp.slug !== relation.slug) {
						return false;
					}

					if (!relationOp.options?.deleteOrphaned) {
						return false;
					}

					switch (relationOp.type) {
						case "clear":
							return true;
						case "remove":
							return relationOp.target === relation.relatedPubId;
						case "override":
							return true;
					}
				});
			});

			if (!possiblyOrphanedRelations.length) {
				continue;
			}

			possiblyOrphanedRelations.forEach((r) => {
				relationsToCheckForOrphans.add(r.relatedPubId);
			});
		}

		await this.cleanupOrphanedPubs(
			trx,
			Array.from(relationsToCheckForOrphans),
			lastModifiedBy,
			communityId
		);
	}

	/**
	 * remove pubs that have been disconnected/their value removed,
	 * has `deleteOrphaned` set to true for their relevant relation operation,
	 * AND have no other relations
	 *
	 * curently it's not possible to forcibly remove pubs if they are related to other pubs
	 * perhaps this could be yet another setting
	 *
	 * ### Brief explanation
	 *
	 * Say we have the following graph of pubs,
	 * where `A --> C` indicates the existence of a `pub_value`
	 * ```ts
	 * {
	 * 	 pubId: "A",
	 * 	 relatedPubId: "C",
	 * }
	 * ```
	 *
	 * ```
	 *                A               J
	 *             ┌──┴───┐           │
	 *             ▼      ▼           ▼
	 *             B      C ────────► I
	 *             │    ┌─┴────┐
	 *             ▼    ▼      ▼
	 *             G ─► E      D
	 *                  │      │
	 *                  ▼      ▼
	 *                  F      H
	 *                       ┌─┴──┐
	 *                       ▼    ▼
	 *                       K ──► L
	 * ```
	 *
	 * Say we now disconnect `C` from `A`, i.e. we remove the `pub_value` where `pubId = "A"` and `relatedPubId = "C"`
	 *
	 *
	 * Now we disrelate C from A, which should
	 *  orphan everything from D down,
	 * but should not orphan I, bc J still points to it
	 * and should not orphan G, bc B still points to it
	 * it orphans L, even though K points to it, because K is itself an orphan
	 * ```
	 *                A               J
	 *             ┌──┴               │
	 *             ▼                  ▼
	 *             B      C ────────► I
	 *             │    ┌─┴────┐
	 *             ▼    ▼      ▼
	 *             G ─► E      D
	 *                  │      │
	 *                  ▼      ▼
	 *                  F      H
	 *                       ┌─┴──┐
	 *                       ▼    ▼
	 *                       K ──► L
	 * ```
	 *
	 * Then by using the following rules, we can determine which pubs should be deleted:
	 *
	 * 1. All pubs down from the disconnected pub
	 * 2. Which are not reachable from any other pub not in the tree
	 *
	 * Using these two rules, we can determine which pubs should be deleted:
	 * 1. C, as C is disconnected is not the target of any other relation
	 * 2. D, F, H, K, and L, as they are only reachable from C, which is being deleted
	 *
	 * Notably, E and I are not deleted, because
	 * 1. E is the target of a relation from G, which, while still a relation itself, is not reachable from the C-tree
	 * 2. I is the target of a relation from J, which, while still a relation itself, is not reachable from the C-tree
	 *
	 * So this should be the resulting graph:
	 *
	 * ```
	 *                A               J
	 *             ┌──┴               │
	 *             ▼                  ▼
	 *             B                  I
	 *             │
	 *             ▼
	 *             G ─► E
	 *                  │
	 *                  ▼
	 *                  F
	 * ```
	 *
	 *
	 */
	protected async cleanupOrphanedPubs(
		trx: Transaction<Database>,
		orphanedPubIds: PubsId[],
		lastModifiedBy: LastModifiedBy,
		communityId: CommunitiesId
	): Promise<void> {
		if (orphanedPubIds.length === 0) {
			return;
		}

		const pubsToDelete = await trx
			.withRecursive("affected_pubs", (db) => {
				// Base case: direct connections from the to-be-removed-pubs down
				const initial = db
					.selectFrom("pub_values")
					.select(["pubId as id", sql<string[]>`array["pubId"]`.as("path")])
					.where("pubId", "in", orphanedPubIds);

				// Recursive case: keep traversing outward
				const recursive = db
					.selectFrom("pub_values")
					.select([
						"relatedPubId as id",
						sql<string[]>`affected_pubs.path || array["relatedPubId"]`.as("path"),
					])
					.innerJoin("affected_pubs", "pub_values.pubId", "affected_pubs.id")
					.where((eb) => eb.not(eb("relatedPubId", "=", eb.fn.any("affected_pubs.path")))) // Prevent cycles
					.$narrowType<{ id: PubsId }>();

				return initial.union(recursive);
			})
			// pubs in the affected_pubs table but which should not be deleted because they are still related to other pubs
			.with("safe_pubs", (db) => {
				return (
					db
						.selectFrom("pub_values")
						.select(["relatedPubId as id"])
						.distinct()
						// crucial part:
						// find all the pub_values which
						// - point to a node in the affected_pubs
						// - but are not themselves affected
						// these are the "safe" nodes
						.innerJoin("affected_pubs", "pub_values.relatedPubId", "affected_pubs.id")
						.where((eb) =>
							eb.not(
								eb.exists((eb) =>
									eb
										.selectFrom("affected_pubs")
										.select("id")
										.whereRef("id", "=", "pub_values.pubId")
								)
							)
						)
				);
			})
			.selectFrom("affected_pubs")
			.select(["id", "path"])
			.distinctOn("id")
			.where((eb) =>
				eb.not(
					eb.exists((eb) =>
						eb
							.selectFrom("safe_pubs")
							.select("id")
							.where(sql<boolean>`safe_pubs.id = any(affected_pubs.path)`)
					)
				)
			)
			.execute();

		if (pubsToDelete.length > 0) {
			await deletePub({
				pubId: pubsToDelete.map((p) => p.id),
				communityId,
				lastModifiedBy,
				trx,
			});
		}
	}

	/**
	 * Process values for all pubs in the operations map
	 */
	protected async processValues(
		trx: Transaction<Database>,
		operations: OperationsMap,
		targetMap: Map<ValueTarget, PubsId>,
		lastModifiedBy: LastModifiedBy,
		communityId: CommunitiesId,
		continueOnValidationError = false
	): Promise<void> {
		const toUpsert = Array.from(operations.entries()).flatMap(([key, op]) => {
			const pubId = this.resolveTargetId(key, targetMap);

			return [
				// regular values
				...op.values.map((v) => ({
					pubId,
					slug: v.slug,
					value: v.value,
					options: v.options,
				})),
				// relations
				...op.relationsToAdd.map((r) => ({
					pubId,
					slug: r.slug,
					value: r.value,
					relatedPubId: this.resolveTargetId(r.target, targetMap),
				})),
			];
		});

		if (toUpsert.length === 0) {
			return;
		}

		const validated = await validatePubValues({
			pubValues: toUpsert,
			communityId,
			continueOnValidationError,
			trx,
		});

		const { values, relations } = this.partitionValidatedValues(validated, lastModifiedBy);

		// Group by pubId for deleteExistingValues handling
		const pubsToDeleteValues = new Set<PubsId>();
		const pubsToFieldIds = new Map<PubsId, Set<PubFieldsId>>();

		// Track which pubs need to have existing values deleted
		for (const value of values) {
			if (value.options?.deleteExistingValues) {
				pubsToDeleteValues.add(value.pubId);
			}

			// Track fieldIds for each pub to avoid deleting values we're about to upsert
			if (!pubsToFieldIds.has(value.pubId)) {
				pubsToFieldIds.set(value.pubId, new Set());
			}
			pubsToFieldIds.get(value.pubId)!.add(value.fieldId);
		}

		// Delete existing values for pubs that need it
		if (pubsToDeleteValues.size > 0) {
			for (const pubId of pubsToDeleteValues) {
				const fieldIds = Array.from(pubsToFieldIds.get(pubId) || []);

				// Get non-updating values that should be deleted
				const nonUpdatingValues = await trx
					.selectFrom("pub_values")
					.where("pubId", "=", pubId)
					.where("relatedPubId", "is", null)
					.where((eb) =>
						fieldIds.length > 0 ? eb("fieldId", "not in", fieldIds) : eb.eb.val(true)
					)
					.select("id")
					.execute();

				if (nonUpdatingValues.length > 0) {
					await deletePubValuesByValueId({
						pubId,
						valueIds: nonUpdatingValues.map((v) => v.id),
						lastModifiedBy,
						trx,
					});
				}
			}
		}

		// Upsert all values and relations in efficient batches
		await Promise.all([
			values.length > 0 &&
				upsertPubValues({
					pubId: "xxx" as PubsId, // pubId is set in each value
					pubValues: values,
					lastModifiedBy,
					trx,
				}),
			relations.length > 0 &&
				upsertPubRelationValues({
					pubId: "xxx" as PubsId, // pubId is set in each relation
					allRelationsToCreate: relations,
					lastModifiedBy,
					trx,
				}),
		]);
	}

	/**
	 * Split validated values into regular values and relations
	 */
	protected partitionValidatedValues<
		T extends {
			pubId: PubsId;
			fieldId: PubFieldsId;
			value: PubValue;
			options?: SetOptions;
		},
	>(validated: Array<T & { relatedPubId?: PubsId }>, lastModifiedBy: LastModifiedBy) {
		return {
			values: validated
				.filter((v) => !("relatedPubId" in v) || !v.relatedPubId)
				.map((v) => ({
					pubId: v.pubId,
					fieldId: v.fieldId,
					value: v.value,
					lastModifiedBy,
					options: v.options,
				})),
			relations: validated
				.filter(
					(v): v is T & { relatedPubId: PubsId } =>
						"relatedPubId" in v && !!v.relatedPubId
				)
				.map((v) => ({
					pubId: v.pubId,
					fieldId: v.fieldId,
					value: v.value,
					relatedPubId: v.relatedPubId,
					lastModifiedBy,
					options: v.options,
				})),
		};
	}
}

/**
 * common operations available to all single pub op types
 */
abstract class SinglePubOp extends PubOpBase {
	protected readonly options: PubOpOptions;
	protected readonly commands: PubOpCommand[] = [];
	readonly target: PubsId | { slug: string; value: PubValue };
	/**
	 * Map of value targets to pub ids
	 *
	 * Used to resolve non-id targets to id targets
	 */
	private targetMap: Map<ValueTarget, PubsId>;

	constructor(options: PubOpOptions & { id?: PubsId }) {
		super();
		this.options = options;
		this.target = options.target ?? options.id ?? (crypto.randomUUID() as PubsId);
		this.targetMap = new Map<ValueTarget, PubsId>();
	}

	/**
	 * Set a single value
	 */
	set(slug: string, value: PubValue, options?: SetOptions): this;
	/**
	 * Set a single value, ignoring nullish values
	 */
	set(
		slug: string,
		value: PubValue | null | undefined,
		options: SetOptions & { ignoreNullish: true }
	): this;
	/**
	 * Set multiple values
	 */
	set(values: Record<string, PubValue>, options?: SetOptions): this;
	/**
	 * Set multiple values, ignoring nullish values
	 */
	set(
		values: Record<string, PubValue | null | undefined>,
		options?: SetOptions & { ignoreNullish: true }
	): this;
	set(
		slugOrValues: string | Record<string, PubValue | null | undefined>,
		valueOrOptions?: PubValue | SetOptions,
		options?: SetOptions
	): this {
		const mode = typeof slugOrValues === "string" ? "single" : "multiple";

		const defaultOptions = this.getMode() === "upsert" ? { deleteExistingValues: true } : {};

		const opts = {
			...defaultOptions,
			...(mode === "single" ? (options as SetOptions) : (valueOrOptions as SetOptions)),
		};

		if (mode === "single") {
			if (valueOrOptions === null && opts?.ignoreNullish) {
				return this;
			}
			this.commands.push({
				type: "set",
				slug: slugOrValues as string,
				value: valueOrOptions,
				options: opts,
			});
			return this;
		}

		const commands = Object.entries(slugOrValues)
			.filter(([_, value]) => (opts?.ignoreNullish ? value != null : true))
			.map(([slug, value]) => ({
				type: "set" as const,
				slug,
				value,
				options: opts,
			}));

		this.commands.push(...commands);
		return this;
	}

	private isRelationBlockConfig(
		valueOrRelations:
			| PubValue
			| Array<{
					target: PubsId | SinglePubOp | ((builder: NestedPubOpBuilder) => SinglePubOp);
					value: PubValue;
			  }>
	): valueOrRelations is Array<{
		target: PubsId | SinglePubOp | ((builder: NestedPubOpBuilder) => SinglePubOp);
		value: PubValue;
	}> {
		if (!Array.isArray(valueOrRelations)) {
			return false;
		}

		return valueOrRelations.every(
			(r) => typeof r === "object" && r !== null && "target" in r && "value" in r
		);
	}

	/**
	 * Relate to a single pub by value instead of PubId
	 *
	 * Useful for doing imports when you know some other unique value of a Pub other than its Id
	 */
	relateByValue(
		/* The slug on the source pub these pubs should be related by */
		slug: string,
		/* The value of the relation */
		value: PubValue,

		/**
		 * The target of the relation
		 *
		 * The slug is the field of the target pub that has the unique value,
		 * the value is the value of that field
		 */
		target: ValueTarget,
		options?: RelationOptions
	): this;
	/**
	 * Relate to multiple pubs by value instead of PubId
	 *
	 * Useful for doing imports when you know some other unique value of a Pub other than its Id
	 */
	relateByValue(
		/* The slug on the source pub these pubs should be related by */
		slug: string,
		values: {
			/* The value of the relation */
			value: JsonValue;
			/**
			 * The target of the relation
			 *
			 * The slug is the field of the target pub that has the unique value,
			 * the value is the value of that field
			 */
			target: ValueTarget;
		}[],
		options?: RelationOptions
	): this;
	relateByValue(
		slug: string,
		valueOrValues: PubValue | { value: JsonValue; target: ValueTarget }[],
		targetOrOptions?: ValueTarget | ValueTarget[] | RelationOptions,
		maybeOptions?: RelationOptions
	): this {
		// for upsert we almost always want to replace existing relations
		const defaultOptions = this.getMode() === "upsert" ? { replaceExisting: true } : {};

		const isMulti =
			Array.isArray(valueOrValues) &&
			valueOrValues.every(
				(v) => typeof v === "object" && v !== null && "value" in v && "target" in v
			);
		const options = isMulti ? maybeOptions : (targetOrOptions as RelationOptions);

		const opts = {
			...defaultOptions,
			...options,
		};

		const targets = isMulti
			? valueOrValues
			: [{ target: targetOrOptions as ValueTarget, value: valueOrValues as JsonValue }];

		if (!targets?.length) {
			return this;
		}

		this.commands.push({
			type: "relateByValue",
			slug,
			relations: targets as { target: { slug: string; value: PubValue }; value: PubValue }[],
			options: opts,
		});

		return this;
	}

	/**
	 * Relate to a single pub with a value
	 */
	relate(
		slug: string,
		value: PubValue,
		target: ActivePubOp | PubsId | ((pubOp: NestedPubOpBuilder) => ActivePubOp),
		options?: RelationOptions
	): this;
	/**
	 * Relate to multiple pubs at once
	 */
	relate(
		slug: string,
		relations: Array<{
			target: PubsId | ActivePubOp | ((builder: NestedPubOpBuilder) => ActivePubOp);
			value: PubValue;
		}>,
		options?: RelationOptions
	): this;
	relate(
		slug: string,
		valueOrRelations:
			| PubValue
			| Array<{
					target: PubsId | ActivePubOp | ((builder: NestedPubOpBuilder) => ActivePubOp);
					value: PubValue;
			  }>,
		targetOrOptions?:
			| ActivePubOp
			| PubsId
			| ((pubOp: NestedPubOpBuilder) => ActivePubOp)
			| RelationOptions,
		options?: RelationOptions
	): this {
		const nestedBuilder = new NestedPubOpBuilder(this.options);

		// for upsert we almost always want to replace existing relations
		const defaultOptions = this.getMode() === "upsert" ? { replaceExisting: true } : {};

		// multi relation case
		if (this.isRelationBlockConfig(valueOrRelations)) {
			this.commands.push({
				type: "relate",
				slug,
				relations: valueOrRelations.map((r) => ({
					target: typeof r.target === "function" ? r.target(nestedBuilder) : r.target,
					value: r.value,
				})),
				options: (targetOrOptions as RelationOptions) ?? defaultOptions,
			});
			return this;
		}

		// single relation case
		const target = targetOrOptions as
			| ActivePubOp
			| PubsId
			| ((pubOp: NestedPubOpBuilder) => ActivePubOp);
		const resolvedTarget = typeof target === "function" ? target(nestedBuilder) : target;

		if (typeof resolvedTarget === "string" && !isPubId(resolvedTarget)) {
			throw new PubOpInvalidTargetError(slug, resolvedTarget);
		}

		this.commands.push({
			type: "relate",
			slug,
			relations: [
				{
					target: resolvedTarget,
					value: valueOrRelations,
				},
			],
			options: options ?? defaultOptions,
		});
		return this;
	}

	/**
	 * Set the stage of the pub
	 *
	 * `null` meaning no stage
	 */
	setStage(stage: StagesId | null): this {
		this.commands.push({
			type: "setStage",
			stage,
		});
		return this;
	}

	/**
	 * Execute the pub op and return the pub id
	 */
	async execute(): Promise<PubsId> {
		const { trx = db } = this.options;
		return maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));
	}

	/**
	 * Execute the pub op and return the updated/created pub
	 */
	async executeAndReturnPub(): Promise<ProcessedPub> {
		const { trx = db } = this.options;
		const pubId = await maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));

		return getPubsWithRelatedValues({ pubId, communityId: this.options.communityId }, { trx });
	}

	// END OF PUBLIC API

	/**
	 * Create a big list of operations that will be executed
	 * The goal is to process all the nested pub ops iteratively rather than recursively
	 */
	protected collectOperations(processed = new Set<PubsId | ValueTarget>()): OperationsMap {
		// If we've already processed this PubOp, return empty map to avoid circular recursion
		if (processed.has(this.target)) {
			return new Map();
		}

		const operations = new Map() as OperationsMap;
		processed.add(this.target);

		// Add this pub's operations
		operations.set(this.target, {
			target: this.target,
			mode: this.getMode(),
			pubTypeId: this.options.pubTypeId,
			values: this.collectValues(),
			relationsToAdd: [],
			relationsToRemove: [],
			relationsToClear: [],
		} as CollectedOperation);

		for (const cmd of this.commands) {
			const rootOp = operations.get(this.target);
			assert(rootOp, "Root operation not found");

			if (cmd.type === "set") continue; // Values already collected

			if (cmd.type === "unrelate") {
				if (cmd.slug === "*") {
					rootOp.relationsToClear.push({
						slug: "*",
						options: cmd.options,
					});
					continue;
				}

				if (cmd.target === "*") {
					rootOp.relationsToClear.push({
						slug: cmd.slug,
						options: cmd.options,
					});
					continue;
				}

				rootOp.relationsToRemove.push({
					slug: cmd.slug,
					target: cmd.target,
					options: cmd.options,
				});
			} else if (cmd.type === "setStage") {
				rootOp.stage = cmd.stage;
			} else if (cmd.type === "relate") {
				cmd.relations.forEach((relation) => {
					// if the target is just a PubId, we can add the relation directly

					if (typeof relation.target === "string" && isPubId(relation.target)) {
						rootOp.relationsToAdd.push({
							slug: cmd.slug,
							value: relation.value,
							target: relation.target as PubsId,
							options: cmd.options,
						});

						return;
					}

					rootOp.relationsToAdd.push({
						slug: cmd.slug,
						value: relation.value,
						target: relation.target.target,
						options: cmd.options,
					});

					// if we have already processed this target, we can stop here
					if (processed.has(relation.target.target)) {
						return;
					}

					const targetOps = collectOperationsFromPubOp(relation.target, processed);
					for (const [key, value] of targetOps) {
						operations.set(key, value);
					}
				});
			} else if (cmd.type === "relateByValue") {
				cmd.relations.forEach((relation) => {
					rootOp.relationsToAdd.push({
						slug: cmd.slug,
						value: relation.value,
						target: relation.target,
						options: cmd.options,
					});
				});
			} else if (cmd.type === "unrelateByValue") {
				cmd.relations.forEach((relation) => {
					rootOp.relationsToRemove.push({
						slug: cmd.slug,
						target: relation.target,
						options: cmd.options,
					});
				});
			}
		}

		return operations;
	}

	protected abstract getMode(): OperationMode;

	/**
	 * execute the operations with a transaction
	 *
	 * this is where the magic happens, basically
	 */
	protected async executeWithTrx(trx: Transaction<Database>): Promise<PubsId> {
		const operations = this.collectOperations();
		const targetMap = new Map<ValueTarget, PubsId>();

		await this.resolveAllNonIdTargets(trx, operations, targetMap, this.options.communityId);

		await this.createAllPubs(trx, operations, targetMap, this.options.communityId, true);
		await this.processStages(trx, operations, targetMap);
		await this.processRelations(
			trx,
			operations,
			targetMap,
			this.options.lastModifiedBy,
			this.options.communityId
		);
		await this.processValues(
			trx,
			operations,
			targetMap,
			this.options.lastModifiedBy,
			this.options.communityId,
			this.options.continueOnValidationError
		);

		return this.resolveTargetId(this.target, targetMap);
	}

	private collectValues(): Array<{ slug: string; value: PubValue; options?: SetOptions }> {
		return this.commands
			.filter(
				(cmd): cmd is Extract<PubOpCommand, { type: "set" }> =>
					cmd.type === "set" && cmd.value !== undefined
			)
			.map((cmd) => ({
				slug: cmd.slug,
				value: cmd.value!,
				options: cmd.options,
			}));
	}
}

// Implementation classes - these are not exported
class CreatePubOp extends SinglePubOp {
	private readonly initialId?: PubsId;

	constructor(options: PubOpOptions, initialId?: PubsId) {
		super({
			...options,
			id: initialId,
		});
		this.initialId = initialId;
	}

	protected getMode(): OperationMode {
		return "create";
	}

	protected getInitialId(): PubsId | undefined {
		return this.initialId;
	}
}

class UpsertPubOp extends SinglePubOp {
	private readonly initialTarget?: PubsId | ValueTarget;

	constructor(options: PubOpOptionsCreateUpsert, initialTarget: PubsId | ValueTarget) {
		super({ ...options, target: initialTarget });
		this.initialTarget = initialTarget;
	}

	protected getMode(): OperationMode {
		return "upsert";
	}
}

class UpdatePubOp extends SinglePubOp implements UpdateOnlyOps {
	private readonly initialTarget?: PubsId | ValueTarget;

	constructor(
		options: Omit<PubOpOptionsCreateUpsert, "pubTypeId">,
		initialTarget: PubsId | ValueTarget
	) {
		super({ ...options, target: initialTarget });
		this.initialTarget = initialTarget;
	}

	protected getMode(): OperationMode {
		return "update";
	}

	/**
	 * Delete a value from the pub
	 *
	 * Will behave similarly to `unrelate('all')` if used for relations, except without the option to delete orphaned pubs
	 */
	unset(slug: string): this {
		this.commands.push({
			type: "unset",
			slug,
		});
		return this;
	}

	unrelateByValue(
		slug: string,
		target: ValueTarget | ValueTarget[],
		options?: RelationOptions
	): this {
		const targets = Array.isArray(target) ? target : [target];

		this.commands.push({
			type: "unrelateByValue",
			slug,
			relations: targets.map((t) => ({ target: t, value: t.value, options })),
			options,
		});
		return this;
	}

	/**
	 * Disconnect all relations by passing `*` as the slug
	 *
	 * `deleteOrphaned: true` will delete the pubs that are now orphaned as a result of the disconnect.
	 */
	unrelate(slug: "*", options?: { deleteOrphaned?: boolean }): this;
	/**
	 * Disconnect a specific relation
	 *
	 * If you pass `*` as the target, all relations for that field will be removed
	 *
	 * If you pass a pubId as the target, only that relation will be removed
	 *
	 * `deleteOrphaned: true` will delete the pubs that are now orphaned as a result of the disconnect.
	 */
	unrelate(slug: string, target: PubsId | "*", options?: { deleteOrphaned?: boolean }): this;
	unrelate(
		slug: string,
		optionsOrTarget?: PubsId | "*" | { deleteOrphaned?: boolean },
		options?: { deleteOrphaned?: boolean }
	): this {
		this.commands.push({
			type: "unrelate",
			slug,
			target: typeof optionsOrTarget === "string" ? optionsOrTarget : "*",
			options: typeof optionsOrTarget === "string" ? options : optionsOrTarget,
		});
		return this;
	}
}

/**
 * Class for batching multiple pub operations and executing them efficiently
 */
class BatchPubOp extends PubOpBase {
	private operations: ActivePubOp[] = [];
	private readonly sharedOptions: Omit<PubOpOptionsBase, "target">;

	constructor(options: Omit<PubOpOptionsBase, "target">) {
		super();
		this.sharedOptions = options;
	}

	/**
	 * Add a pub operation to the batch
	 */
	add(
		operationBuilder: (ops: {
			create: (options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }) => CreatePubOp;
			createWithId: (
				id: PubsId,
				options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }
			) => CreatePubOp;
			update: (id: PubsId, options?: Partial<PubOpOptionsBase>) => UpdatePubOp;
			upsert: (
				id: PubsId,
				options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
			) => UpsertPubOp;
			upsertByValue: (
				slug: string,
				value: PubValue,
				options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
			) => UpsertPubOp;
		}) => ActivePubOp
	): this {
		const nestedBuilder = {
			create: (options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }) =>
				new CreatePubOp({ ...this.sharedOptions, ...options }),

			createWithId: (
				id: PubsId,
				options: Partial<PubOpOptionsBase> & { pubTypeId: PubTypesId }
			) => new CreatePubOp({ ...this.sharedOptions, ...options }, id),

			update: (id: PubsId, options: Partial<PubOpOptionsBase> = {}) =>
				new UpdatePubOp({ ...this.sharedOptions, ...options }, id),

			upsert: (
				id: PubsId,
				options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
			) => new UpsertPubOp({ ...this.sharedOptions, ...options }, id),

			upsertByValue: (
				slug: string,
				value: PubValue,
				options: Omit<PubOpOptionsCreateUpsert, keyof Omit<PubOpOptionsBase, "pubTypeId">>
			) => new UpsertPubOp({ ...this.sharedOptions, ...options }, { slug, value }),
		};

		const operation = operationBuilder(nestedBuilder);
		this.operations.push(operation);
		return this;
	}

	/**
	 * Execute all operations in the batch
	 * @returns Array of pub IDs in the same order as operations were added
	 */
	async execute(): Promise<PubsId[]> {
		const { trx = db } = this.sharedOptions;
		return maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));
	}

	/**
	 * Execute all operations in the batch and return the updated/created pubs
	 * @returns Array of processed pubs in the same order as operations were added
	 */
	async executeAndReturnPubs(): Promise<ProcessedPub[]> {
		const { trx = db } = this.sharedOptions;
		const pubIds = await maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));

		return Promise.all(
			pubIds.map((pubId) =>
				getPubsWithRelatedValues(
					{ pubId, communityId: this.sharedOptions.communityId },
					{ trx }
				)
			)
		);
	}

	protected async executeWithTrx(trx: Transaction<Database>): Promise<PubsId[]> {
		// collect all operations from all pub ops
		const allOperationsMap = new Map<PubsId | ValueTarget, CollectedOperation>();

		// collect the target mapping for value targets
		const targetMap = new Map<ValueTarget, PubsId>();

		// track the original order of operations for returning results
		const originalOperations: Array<PubsId | ValueTarget> = [];

		// Collect operations from all pub ops
		for (const op of this.operations) {
			originalOperations.push(op.target);

			// Collect operations from this PubOp
			const pubOpOperations = collectOperationsFromPubOp(op, new Set());

			// merge the operations
			for (const [target, operation] of pubOpOperations.entries()) {
				if (allOperationsMap.has(target)) {
					const existingOp = allOperationsMap.get(target)!;

					// merge the operations
					existingOp.values.push(...operation.values);
					existingOp.relationsToAdd.push(...operation.relationsToAdd);
					existingOp.relationsToRemove.push(...operation.relationsToRemove);
					existingOp.relationsToClear.push(...operation.relationsToClear);

					// if the operation sets a stage, use that
					if (operation.stage !== undefined) {
						existingOp.stage = operation.stage;
					}
				} else {
					allOperationsMap.set(target, operation);
				}
			}
		}

		// Use shared methods from PubOpBase
		await this.resolveAllNonIdTargets(
			trx,
			allOperationsMap,
			targetMap,
			this.sharedOptions.communityId
		);
		await this.createAllPubs(trx, allOperationsMap, targetMap, this.sharedOptions.communityId);
		await this.processStages(trx, allOperationsMap, targetMap);
		await this.processRelations(
			trx,
			allOperationsMap,
			targetMap,
			this.sharedOptions.lastModifiedBy,
			this.sharedOptions.communityId
		);

		// Determine if any operations allow continuing on validation error
		const continueOnValidationError = this.operations.some(
			(op) =>
				"continueOnValidationError" in (op as any).options &&
				(op as any).options.continueOnValidationError
		);

		await this.processValues(
			trx,
			allOperationsMap,
			targetMap,
			this.sharedOptions.lastModifiedBy,
			this.sharedOptions.communityId,
			continueOnValidationError
		);

		// Return pub IDs in the original order
		return originalOperations.map((target) => this.resolveTargetId(target, targetMap));
	}
}

/**
 * A PubOp is a builder for a pub.
 *
 * It can be used to create, update or upsert a pub.
 */
export class PubOp {
	/**
	 * Create a new pub
	 */
	static create(options: PubOpOptions): CreatePubOp {
		return new CreatePubOp(options);
	}

	/**
	 * Create a new pub with a specific id
	 */
	static createWithId(id: PubsId, options: PubOpOptions): CreatePubOp {
		return new CreatePubOp(options, id);
	}

	/**
	 * Update an existing pub
	 */
	static update(id: PubsId, options: PubOpOptionsUpdate): UpdatePubOp {
		return new UpdatePubOp(options, id);
	}

	/**
	 * Update an existing pub by a specific value
	 */
	static updateByValue(
		slug: string,
		value: PubValue,
		options: Omit<PubOpOptions, "pubTypeId">
	): UpdatePubOp {
		return new UpdatePubOp(options, { slug, value });
	}

	/**
	 * Upsert a pub
	 *
	 * Either create a new pub, or override an existing pub
	 */
	static upsert(id: PubsId, options: PubOpOptionsCreateUpsert): UpsertPubOp {
		return new UpsertPubOp(options, id);
	}

	/**
	 * Upsert a pub by a specific, presumed to be unique, value
	 *
	 * Eg you want to upsert a pub by a google drive id, you would do
	 * ```ts
	 * PubOp.upsertByValue("community-slug:googleDriveId", googleDriveId, options)
	 * ```
	 */
	static upsertByValue(
		slug: string,
		value: PubValue,
		options: PubOpOptionsCreateUpsert
	): UpsertPubOp {
		return new UpsertPubOp(options, { slug, value });
	}

	/**
	 * Create a batch operation for efficiently executing multiple pub operations
	 *
	 * @example
	 * ```ts
	 * await PubOp.batch({ communityId, lastModifiedBy })
	 *   .add(ops => ops.create({ pubTypeId: "type1" }).set("title", "Title 1"))
	 *   .add(ops => ops.update(existingId).set("title", "Updated Title"))
	 *   .add(ops => ops.upsert(maybeExistingId, { pubTypeId: "type2" }).set("title", "Title 3"))
	 *   .execute()
	 * ```
	 */
	static batch(options: Omit<PubOpOptionsBase, "target">): BatchPubOp {
		return new BatchPubOp(options);
	}
}
