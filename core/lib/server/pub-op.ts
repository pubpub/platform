import type { Kysely, Transaction } from "kysely";

import { sql } from "kysely";

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
	options: RelationOptions;
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

/**
 * common operations available to all PubOp types
 */
abstract class BasePubOp {
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
		if (valueOrOptions === null && options?.ignoreNullish) {
			return this;
		}

		const defaultOptions = this.getMode() === "upsert" ? { deleteExistingValues: true } : {};

		if (typeof slugOrValues === "string") {
			this.commands.push({
				type: "set",
				slug: slugOrValues,
				value: valueOrOptions,
				options: options ?? defaultOptions,
			});
			return this;
		}

		this.commands.push(
			...Object.entries(slugOrValues)
				.filter(([_, value]) => (options?.ignoreNullish ? value != null : true))
				.map(([slug, value]) => ({
					type: "set" as const,
					slug,
					value,
					options: (valueOrOptions as SetOptions) ?? defaultOptions,
				}))
		);
		return this;
	}

	private isRelationBlockConfig(
		valueOrRelations:
			| PubValue
			| Array<{
					target: PubsId | BasePubOp | ((builder: NestedPubOpBuilder) => BasePubOp);
					value: PubValue;
			  }>
	): valueOrRelations is Array<{
		target: PubsId | BasePubOp | ((builder: NestedPubOpBuilder) => BasePubOp);
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

	async execute(): Promise<ProcessedPub> {
		const { trx = db } = this.options;
		const pubId = await maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));
		return getPubsWithRelatedValues({ pubId, communityId: this.options.communityId }, { trx });
	}

	// END OF PUBLIC API

	/**
	 * Create a big list of operations that will be executed
	 * The goal is to process all the nested pub ops iteratively rather than recursively
	 */
	private collectOperations(processed = new Set<PubsId | ValueTarget>()): OperationsMap {
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

					const targetOps = relation.target.collectOperations(processed);
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
	 * resolve a target to a pub id
	 *
	 * if no target is provided, the target of the current pub op will be used
	 *
	 * if the target is a pub id, it will be returned as is
	 */
	private getId(target?: PubsId | ValueTarget): PubsId {
		if (!target) {
			return this.getId(this.target);
		}

		if (typeof target === "string" && isPubId(target)) {
			return target;
		}

		const id = this.targetMap.get(target);

		if (!id) {
			throw new PubOpError(
				"UNKNOWN",
				`Target ${target} not found. Did you call resolveTarget before calling resolveNonIdTargets?`
			);
		}

		return id;
	}

	/**
	 * execute the operations with a transaction
	 *
	 * this is where the magic happens, basically
	 */
	protected async executeWithTrx(trx: Transaction<Database>): Promise<PubsId> {
		const operations = this.collectOperations();

		await this.resolveNonIdTargets(trx, operations);

		await this.createAllPubs(trx, operations);
		await this.processStages(trx, operations);
		await this.processRelations(trx, operations);
		await this.processValues(trx, operations);

		return this.getId();
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

	/**
	 * Find the pub that is specified using a slug and value rather than a PubId
	 *
	 * @throws if there are multiple pubs that match the target
	 */
	private async resolveNonIdTarget(
		trx: Kysely<Database>,
		target: { slug: string; value: PubValue }
	): Promise<ProcessedPub> {
		const pubs = await getPubsWithRelatedValues(
			{
				communityId: this.options.communityId,
			},
			{
				trx,
				filters: {
					[target.slug]: {
						$eq: target.value,
					},
				},
				limit: 2,
			}
		);

		if (pubs.length > 1) {
			logger.error(
				{ pub1: pubs[0], pub2: pubs[1], msg: "Multiple pubs found for target: %s = %s" },
				target.slug,
				target.value
			);
			throw new PubOpError(
				"AMBIGUOUS_TARGET",
				`Multiple pubs found for target: ${target.slug} = ${target.value}.\n Pub 1: ${pubs[0].id}\n Pub 2: ${pubs[1].id}`
			);
		}

		if (pubs.length === 0) {
			throw new PubOpError(
				"UNKNOWN",
				`No pub found for target: ${target.slug} = ${target.value}`
			);
		}

		return pubs[0];
	}

	private async resolveNonIdTargets(
		trx: Kysely<Database>,
		operations: OperationsMap
	): Promise<void> {
		const targetIdMap = new Map<{ slug: string; value: PubValue }, PubsId>();

		const topLevelPubsToResolve = Array.from(operations.keys()).filter(
			(key) => typeof key !== "string"
		);

		const otherPubsToResolve = Array.from(operations.values()).flatMap((op) => {
			return [...op.relationsToAdd, ...op.relationsToRemove]
				.filter(({ target }) => typeof target !== "string")
				.map((r) => r.target);
		});

		await Promise.all(
			[...topLevelPubsToResolve, ...otherPubsToResolve].map(async (key) => {
				if (typeof key === "string") {
					throw new PubOpError(
						"UNKNOWN",
						`Target ${key} is a pub id. Did you call resolveTarget before calling resolveNonIdTargets?`
					);
				}

				const pub = await this.resolveNonIdTarget(trx, key);
				targetIdMap.set(key, pub.id);
			})
		);

		this.targetMap = targetIdMap;
	}

	private async createAllPubs(
		trx: Transaction<Database>,
		operations: OperationsMap
	): Promise<void> {
		const createOrUpsertOperations = Array.from(operations.entries()).filter(
			([_, operation]) => operation.mode === "create" || operation.mode === "upsert"
		);

		if (createOrUpsertOperations.length === 0) {
			return;
		}

		const pubsToCreate = createOrUpsertOperations.map(([key, operation]) => ({
			id: this.getId(key),
			communityId: this.options.communityId,
			pubTypeId: expect(operation.pubTypeId),
		}));

		const createdPubs = await autoRevalidate(
			trx
				.insertInto("pubs")
				.values(pubsToCreate)
				.onConflict((oc) => oc.columns(["id"]).doNothing())
				.returningAll()
		).execute();

		/**
		 * this is a bit of a hack to fill in the holes in the array of created pubs
		 * because onConflict().doNothing() does not return anything on conflict
		 * so we have to manually fill in the holes in the array of created pubs
		 * in order to make looping over the operations and upserting values/relations work
		 */
		createOrUpsertOperations.forEach(([key, op], index) => {
			const createdPub = createdPubs[index];
			const pubToCreate = pubsToCreate[index];

			if (pubToCreate.id && pubToCreate.id !== createdPub?.id && op.mode === "create") {
				throw new PubOpCreateExistingError(pubToCreate.id);
			}
		});

		return;
	}

	private async processRelations(
		trx: Transaction<Database>,
		operations: OperationsMap
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

			const pubId = this.getId(pubTarget);

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
				lastModifiedBy: this.options.lastModifiedBy,
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

		await this.cleanupOrphanedPubs(trx, Array.from(relationsToCheckForOrphans));
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
	private async cleanupOrphanedPubs(
		trx: Transaction<Database>,
		orphanedPubIds: PubsId[]
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
				communityId: this.options.communityId,
				lastModifiedBy: this.options.lastModifiedBy,
				trx,
			});
		}
	}

	private async processValues(
		trx: Transaction<Database>,
		operations: OperationsMap
	): Promise<void> {
		const toUpsert = Array.from(operations.entries()).flatMap(([key, op]) => {
			return [
				// regular values
				...op.values.map((v) => ({
					pubId: this.getId(key),
					slug: v.slug,
					value: v.value,
					options: v.options,
				})),
				// relations
				...op.relationsToAdd.map((r) => ({
					pubId: this.getId(key),
					slug: r.slug,
					value: r.value,
					relatedPubId: this.getId(r.target),
				})),
			];
		});

		if (toUpsert.length === 0) {
			return;
		}

		const validated = await validatePubValues({
			pubValues: toUpsert,
			communityId: this.options.communityId,
			continueOnValidationError: this.options.continueOnValidationError,
			trx,
		});

		const { values, relations } = this.partitionValidatedValues(validated);

		// if some values have `deleteExistingValues` set to true,
		// we need to delete all the existing values for this pub
		const shouldDeleteExistingValues = values.some((v) => !!v.options?.deleteExistingValues);

		if (values.length > 0 && shouldDeleteExistingValues) {
			// get all the values that are not being updated

			const nonUpdatingValues = await trx
				.selectFrom("pub_values")
				.where("pubId", "=", this.getId())
				.where("relatedPubId", "is", null)
				.where(
					"fieldId",
					"not in",
					values.map((v) => v.fieldId)
				)
				.select("id")
				.execute();

			await deletePubValuesByValueId({
				pubId: this.getId(),
				valueIds: nonUpdatingValues.map((v) => v.id),
				lastModifiedBy: this.options.lastModifiedBy,
				trx,
			});
		}

		await Promise.all([
			values.length > 0 &&
				upsertPubValues({
					pubId: "xxx" as PubsId,
					pubValues: values,
					lastModifiedBy: this.options.lastModifiedBy,
					trx,
				}),
			relations.length > 0 &&
				upsertPubRelationValues({
					pubId: "xxx" as PubsId,
					allRelationsToCreate: relations,
					lastModifiedBy: this.options.lastModifiedBy,
					trx,
				}),
		]);
	}

	// --- Helper methods ---

	private partitionValidatedValues<
		T extends {
			pubId: PubsId;
			fieldId: PubFieldsId;
			value: PubValue;
			options?: SetOptions;
		},
	>(validated: Array<T & { relatedPubId?: PubsId }>) {
		return {
			values: validated
				.filter((v) => !("relatedPubId" in v) || !v.relatedPubId)
				.map((v) => ({
					pubId: v.pubId,
					fieldId: v.fieldId,
					value: v.value,
					lastModifiedBy: this.options.lastModifiedBy,
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
					lastModifiedBy: this.options.lastModifiedBy,
					options: v.options,
				})),
		};
	}

	private async processStages(
		trx: Transaction<Database>,
		operations: OperationsMap
	): Promise<void> {
		const stagesToUpdate = Array.from(operations.entries())
			.filter(([_, op]) => op.stage !== undefined)
			.map(([target, op]) => ({
				pubId: this.getId(target),
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
}

interface UpdateOnlyOps {
	unset(slug: string): this;
	unrelate(slug: string, target: PubsId, options?: { deleteOrphaned?: boolean }): this;
}

// Implementation classes - these are not exported
class CreatePubOp extends BasePubOp {
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

class UpsertPubOp extends BasePubOp {
	private readonly initialTarget?: PubsId | ValueTarget;

	constructor(options: PubOpOptionsCreateUpsert, initialTarget: PubsId | ValueTarget) {
		super({ ...options, target: initialTarget });
		this.initialTarget = initialTarget;
	}

	protected getMode(): OperationMode {
		return "upsert";
	}
}

class UpdatePubOp extends BasePubOp implements UpdateOnlyOps {
	private readonly pubId: PubsId | undefined;
	private readonly initialSlug?: string;
	private readonly initialValue?: PubValue;

	constructor(
		options: PubOpOptionsUpdate,
		id: PubsId | undefined,
		initialSlug?: string,
		initialValue?: PubValue
	) {
		super({
			...options,
			id,
		});
		this.pubId = id;
		this.initialSlug = initialSlug;
		this.initialValue = initialValue;
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

	protected getInitialId(): PubsId | undefined {
		return this.pubId;
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
		return new UpdatePubOp(options, undefined, slug, value);
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
}

type ActivePubOp = CreatePubOp | UpdatePubOp | UpsertPubOp;
