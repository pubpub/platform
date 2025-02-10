import { randomUUID } from "crypto";

import type { Transaction } from "kysely";

import { sql } from "kysely";

import type { JsonValue, ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId, PubValuesId } from "db/public";
import type { LastModifiedBy } from "db/types";
import { assert, expect } from "utils";
import { isUuid } from "utils/uuid";

import { db } from "~/kysely/database";
import { autoRevalidate } from "./cache/autoRevalidate";
import {
	deletePub,
	deletePubValuesByValueId,
	getPubsWithRelatedValuesAndChildren,
	maybeWithTrx,
	upsertPubRelationValues,
	upsertPubValues,
	validatePubValues,
} from "./pub";

type PubValue = string | number | boolean | JsonValue;

type PubOpOptions = {
	communityId: CommunitiesId;
	pubTypeId?: PubTypesId;
	lastModifiedBy: LastModifiedBy;
	trx?: Transaction<Database>;
};

type RelationOptions =
	| {
			/**
			 * If true, existing relations on the same field will be removed
			 */
			override?: false;
			deleteOrphaned?: never;
	  }
	| {
			/**
			 * If true, existing relations on the same field will be removed
			 */
			override: true;
			/**
			 * If true, pubs that have been disconnected,
			 * either manually or because they were orphaned because of `override: true`,
			 * will be deleted.
			 */
			deleteOrphaned?: boolean;
	  };

// Base commands that will be used internally
type SetCommand = { type: "set"; slug: string; value: PubValue | undefined };
type RelateCommand = {
	type: "connect";
	slug: string;
	relations: Array<{ target: PubOp | PubsId; value: PubValue }>;
	options: RelationOptions;
};
type DisconnectCommand = {
	type: "disconnect";
	slug: string;
	target: PubsId;
	deleteOrphaned?: boolean;
};
type ClearRelationsCommand = {
	type: "clearRelations";
	slug?: string;
	deleteOrphaned?: boolean;
};

type UnsetCommand = {
	type: "unset";
	slug: string;
};

type PubOpCommand =
	| SetCommand
	| RelateCommand
	| DisconnectCommand
	| ClearRelationsCommand
	| UnsetCommand;

type ClearRelationOperation = {
	type: "clear";
	slug: string;
	deleteOrphaned?: boolean;
};

type RemoveRelationOperation = {
	type: "remove";
	slug: string;
	target: PubsId;
	deleteOrphaned?: boolean;
};

type OverrideRelationOperation = {
	type: "override";
	slug: string;
	deleteOrphaned?: boolean;
};

type RelationOperation =
	| ClearRelationOperation
	| RemoveRelationOperation
	| OverrideRelationOperation;

// Types for operation collection
type OperationMode = "create" | "upsert" | "update";

interface CollectedOperationBase {
	id: PubsId | undefined;
	values: Array<{ slug: string; value: PubValue }>;
	relationsToAdd: Array<{
		slug: string;
		value: PubValue;
		target: PubsId;
		override?: boolean;
		deleteOrphaned?: boolean;
	}>;
	relationsToRemove: Array<{
		slug: string;
		target: PubsId;
		deleteOrphaned?: boolean;
	}>;
	relationsToClear: Array<{
		slug: string | "*";
		deleteOrphaned?: boolean;
	}>;
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

type OperationsMap = Map<PubsId, CreateOrUpsertOperation | UpdateOperation>;

export type SingleRelationInput = {
	target: PubOp | PubsId;
	value: PubValue;
	override?: boolean;
	deleteOrphaned?: boolean;
};

function isPubId(val: string | PubsId): val is PubsId {
	return isUuid(val);
}

/**
 * common operations available to all PubOp types
 */
abstract class BasePubOp {
	protected readonly options: PubOpOptions;
	protected readonly commands: PubOpCommand[] = [];
	protected readonly id: PubsId;

	constructor(options: PubOpOptions & { id?: PubsId }) {
		this.options = options;
		this.id = options.id ?? (crypto.randomUUID() as PubsId);
	}

	/**
	 * Set a single value or multiple values
	 */
	set(slug: string, value: PubValue): this;
	set(values: Record<string, PubValue>): this;
	set(slugOrValues: string | Record<string, PubValue>, value?: PubValue): this {
		if (typeof slugOrValues === "string") {
			this.commands.push({
				type: "set",
				slug: slugOrValues,
				value: value!,
			});
		} else {
			this.commands.push(
				...Object.entries(slugOrValues).map(([slug, value]) => ({
					type: "set" as const,
					slug,
					value,
				}))
			);
		}
		return this;
	}

	/**
	 * Connect to one or more pubs with the same value
	 */
	connect(slug: string, target: PubOp | PubsId, value: PubValue, options?: RelationOptions): this;
	/**
	 * Connect to one or more pubs with individual values
	 */
	connect(
		slug: string,
		relations: Array<{ target: PubOp | PubsId; value: PubValue }>,
		options?: RelationOptions
	): this;
	connect(
		slug: string,
		targetsOrRelations: PubOp | PubsId | Array<{ target: PubOp | PubsId; value: PubValue }>,
		valueOrOptions?: PubValue | RelationOptions,
		maybeOptions?: RelationOptions
	): this {
		if (typeof targetsOrRelations === "string" && !isPubId(targetsOrRelations)) {
			throw new Error(
				`Invalid target: should either be an existing pub id or a PubOp instance, but got \`${targetsOrRelations}\``
			);
		}

		const options =
			(Array.isArray(targetsOrRelations)
				? (valueOrOptions as RelationOptions)
				: maybeOptions) ?? {};
		const relations = Array.isArray(targetsOrRelations)
			? targetsOrRelations
			: [
					{
						target: targetsOrRelations,
						value: valueOrOptions as PubValue,
					},
				];

		this.commands.push({
			type: "connect",
			slug,
			relations,
			options,
		});
		return this;
	}

	/**
	 * Set relation values for existing relations
	 */
	setRelation(slug: string, target: PubsId, value: PubValue): this {
		return this.connect(slug, [{ target, value }], { override: false });
	}
	/**
	 * Set multiple relation values for existing relations
	 */
	setRelations(slug: string, relations: Array<{ target: PubsId; value: PubValue }>): this {
		return this.connect(slug, relations, { override: false });
	}

	async execute(): Promise<ProcessedPub> {
		const { trx = db } = this.options;
		const pubId = await maybeWithTrx(trx, (trx) => this.executeWithTrx(trx));
		return getPubsWithRelatedValuesAndChildren(
			{ pubId, communityId: this.options.communityId },
			{ trx }
		);
	}

	protected collectOperations(processed = new Set<PubsId>()): OperationsMap {
		// If we've already processed this PubOp, return empty map to avoid circular recursion
		if (processed.has(this.id)) {
			return new Map();
		}

		const operations = new Map() as OperationsMap;
		processed.add(this.id);

		// Add this pub's operations
		operations.set(this.id, {
			id: this.id,
			mode: this.getMode(),
			pubTypeId: this.options.pubTypeId,
			values: this.collectValues(),
			relationsToAdd: [],
			relationsToRemove: [],
			relationsToClear: [],
		} as CollectedOperation);

		for (const cmd of this.commands) {
			const rootOp = operations.get(this.id);
			assert(rootOp, "Root operation not found");

			if (cmd.type === "set") continue; // Values already collected

			if (cmd.type === "clearRelations") {
				rootOp.relationsToClear.push({
					slug: cmd.slug || "*",
					deleteOrphaned: cmd.deleteOrphaned,
				});
			} else if (cmd.type === "disconnect") {
				rootOp.relationsToRemove.push({
					slug: cmd.slug,
					target: cmd.target,
					deleteOrphaned: cmd.deleteOrphaned,
				});
			} else if (cmd.type === "connect") {
				// Process each relation in the command
				cmd.relations.forEach((relation) => {
					// if the target is just a PubId, we can add the relation directly
					if (!(relation.target instanceof BasePubOp)) {
						rootOp.relationsToAdd.push({
							slug: cmd.slug,
							value: relation.value,
							target: relation.target as PubsId,
							override: cmd.options.override,
							deleteOrphaned: cmd.options.deleteOrphaned,
						});

						return;
					}

					rootOp.relationsToAdd.push({
						slug: cmd.slug,
						value: relation.value,
						target: relation.target.id,
						override: cmd.options.override,
						deleteOrphaned: cmd.options.deleteOrphaned,
					});

					// if we have already processed this target, we can stop here
					if (processed.has(relation.target.id)) {
						return;
					}

					const targetOps = relation.target.collectOperations(processed);
					for (const [key, value] of targetOps) {
						operations.set(key, value);
					}
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

		await this.createAllPubs(trx, operations);
		await this.processRelations(trx, operations);
		await this.processValues(trx, operations);

		return this.id;
	}

	private collectValues(): Array<{ slug: string; value: PubValue }> {
		return this.commands
			.filter(
				(cmd): cmd is Extract<PubOpCommand, { type: "set" }> =>
					cmd.type === "set" && cmd.value !== undefined
			)
			.map((cmd) => ({
				slug: cmd.slug,
				value: cmd.value!,
			}));
	}

	/**
	 * this is a bit of a hack to fill in the holes in the array of created pubs
	 * because onConflict().doNothing() does not return anything on conflict
	 * so we have to manually fill in the holes in the array of created pubs
	 * in order to make looping over the operations and upserting values/relations work
	 */
	private fillCreateResultHoles(
		pubsToCreate: Array<{ id?: PubsId }>,
		pubCreateResult: Array<{ id: PubsId }>
	) {
		let index = 0;
		return pubsToCreate.map((pubToCreate) => {
			const correspondingResult = pubCreateResult[index];

			if (pubToCreate.id && pubToCreate.id !== correspondingResult?.id) {
				return null;
			}

			index++;
			return correspondingResult || null;
		});
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
			id: key,
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

		// fill any gaps in the array of created pubs
		const filledCreatedPubs = this.fillCreateResultHoles(pubsToCreate, createdPubs);

		let index = 0;
		// map each operation to its final pub id
		for (const [key, op] of createOrUpsertOperations) {
			const createdPub = filledCreatedPubs[index];
			const pubToCreate = pubsToCreate[index];

			// if we successfully created a new pub, use its id
			if (createdPub) {
				index++;
				continue;
			}

			// if we had an existing id..., ie it was provided for an upsert or create
			if (pubToCreate.id) {
				// ...but were trying to create a new pub, that's an error, because there's no pub that was created
				// that means we were trying to create a pub with an id that already exists
				if (op.mode === "create") {
					throw new Error(
						`Cannot create a pub with an id that already exists: ${pubToCreate.id}`
					);
				}
				index++;
				continue;
			}

			// // we have symbol key (no id provided) but no pub was created. that's not good
			// if (typeof key === "symbol") {
			// 	throw new Error("Pub not created");
			// }

			// fallback - use the key as the id i guess?
			index++;
		}

		return;
	}

	private async processRelations(
		trx: Transaction<Database>,
		operations: OperationsMap
	): Promise<void> {
		const relationsToCheckForOrphans = new Set<PubsId>();

		for (const [pubId, op] of operations) {
			const allOps = [
				...op.relationsToAdd
					.filter((r) => r.override)
					.map((r) => ({ type: "override", ...r })),
				...op.relationsToClear.map((r) => ({ type: "clear", ...r })),
				...op.relationsToRemove.map((r) => ({ type: "remove", ...r })),
			] as RelationOperation[];

			if (allOps.length === 0) {
				continue;
			}

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

					if (!relationOp.deleteOrphaned) {
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
					pubId: key,
					slug: v.slug,
					value: v.value,
				})),
				// relations
				...op.relationsToAdd.map((r) => ({
					pubId: key,
					slug: r.slug,
					value: r.value,
					relatedPubId: r.target,
				})),
			];
		});

		if (toUpsert.length === 0) {
			return;
		}

		const validated = await validatePubValues({
			pubValues: toUpsert,
			communityId: this.options.communityId,
			continueOnValidationError: false,
			trx,
		});

		const { values, relations } = this.partitionValidatedValues(validated);

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
		T extends { pubId: PubsId; fieldId: PubFieldsId; value: PubValue },
	>(validated: Array<T & { relatedPubId?: PubsId }>) {
		return {
			values: validated
				.filter((v) => !("relatedPubId" in v) || !v.relatedPubId)
				.map((v) => ({
					pubId: v.pubId,
					fieldId: v.fieldId,
					value: v.value,
					lastModifiedBy: this.options.lastModifiedBy,
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
				})),
		};
	}
}

interface UpdateOnlyOps {
	unset(slug: string): this;
	disconnect(slug: string, target: PubsId, options?: { deleteOrphaned?: boolean }): this;
	clearRelationsForField(slug: string, options?: { deleteOrphaned?: boolean }): this;
	clearAllRelations(options?: { deleteOrphaned?: boolean }): this;
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
	private readonly initialId?: PubsId;
	private readonly initialSlug?: string;
	private readonly initialValue?: PubValue;

	constructor(
		options: PubOpOptions,
		initialId?: PubsId,
		initialSlug?: string,
		initialValue?: PubValue
	) {
		super({ ...options, id: initialId });
		this.initialId = initialId;
		this.initialSlug = initialSlug;
		this.initialValue = initialValue;
	}

	protected getMode(): OperationMode {
		return "upsert";
	}

	protected getInitialId(): PubsId | undefined {
		return this.initialId;
	}
}

class UpdatePubOp extends BasePubOp implements UpdateOnlyOps {
	private readonly pubId: PubsId | undefined;
	private readonly initialSlug?: string;
	private readonly initialValue?: PubValue;

	constructor(
		options: Omit<PubOpOptions, "pubTypeId">,
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

	unset(slug: string): this {
		this.commands.push({
			type: "unset",
			slug,
		});
		return this;
	}

	disconnect(slug: string, target: PubsId, options?: { deleteOrphaned?: boolean }): this {
		this.commands.push({
			type: "disconnect",
			slug,
			target,
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}

	clearRelationsForField(slug: string, options?: { deleteOrphaned?: boolean }): this {
		this.commands.push({
			type: "clearRelations",
			slug,
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}

	clearAllRelations(options?: { deleteOrphaned?: boolean }): this {
		this.commands.push({
			type: "clearRelations",
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}
	protected getInitialId(): PubsId | undefined {
		return this.pubId;
	}
}

// The factory class - this is the only exported class
export class PubOp {
	static create(options: PubOpOptions): CreatePubOp {
		return new CreatePubOp(options);
	}

	static createWithId(id: PubsId, options: PubOpOptions): CreatePubOp {
		return new CreatePubOp(options, id);
	}

	static update(id: PubsId, options: Omit<PubOpOptions, "pubTypeId">): UpdatePubOp {
		return new UpdatePubOp(options, id);
	}

	static updateByValue(
		slug: string,
		value: PubValue,
		options: Omit<PubOpOptions, "pubTypeId">
	): UpdatePubOp {
		return new UpdatePubOp(options, undefined, slug, value);
	}

	static upsert(id: PubsId, options: PubOpOptions): UpsertPubOp {
		return new UpsertPubOp(options, id);
	}

	static upsertByValue(slug: string, value: PubValue, options: PubOpOptions): UpsertPubOp {
		return new UpsertPubOp(options, undefined, slug, value);
	}
}
