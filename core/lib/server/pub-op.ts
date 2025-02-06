import type { Transaction } from "kysely";

import { sql } from "kysely";

import type { JsonValue, ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type {
	CommunitiesId,
	CoreSchemaType,
	PubFieldsId,
	PubsId,
	PubTypesId,
	PubValuesId,
} from "db/public";
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
	pubTypeId: PubTypesId;
	lastModifiedBy: LastModifiedBy;
	trx?: Transaction<Database>;
};

type RelationOptions = {
	override?: boolean;
	deleteOrphaned?: boolean;
};

// Base commands that will be used internally
type SetCommand = { type: "set"; slug: string; value: PubValue | undefined };
type RelateCommand = {
	type: "relate";
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

// Types for operation collection
type OperationMode = "create" | "upsert" | "update";

interface CollectedOperation {
	id: PubsId | undefined;
	mode: OperationMode;
	values: Array<{ slug: string; value: PubValue }>;
	relationsToAdd: Array<{
		slug: string;
		value: PubValue;
		target: PubsId | symbol;
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

type OperationsMap = Map<PubsId | symbol, CollectedOperation>;

export type SingleRelationInput = {
	target: PubOp | PubsId;
	value: PubValue;
	override?: boolean;
	deleteOrphaned?: boolean;
};

function isPubId(val: string | PubsId): val is PubsId {
	return isUuid(val);
}

type PubOpMode = "create" | "upsert" | "update";

type PubIdMap = Map<PubsId | symbol, PubsId>;
type RelationModification = {
	slug: string;
	relatedPubId: PubsId | null;
};
type RelationModifications = {
	overrides: Map<string, RelationModification[]>;
	clears: Map<string, RelationModification[]>;
	removes: Map<string, RelationModification[]>;
};

// Common operations available to all PubOp types
abstract class BasePubOp {
	protected readonly options: PubOpOptions;
	protected readonly commands: PubOpCommand[] = [];
	protected readonly thisSymbol: symbol;
	protected static symbolCounter = 0;

	constructor(options: PubOpOptions) {
		this.options = options;
		this.thisSymbol = Symbol(`pub-${BasePubOp.symbolCounter++}`);
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
	 * Unset a value for a specific field
	 */
	unset(slug: string): this {
		this.commands.push({
			type: "set",
			slug,
			value: undefined,
		});
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
			type: "relate",
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

	protected collectOperations(processed = new Set<symbol>()): OperationsMap {
		// If we've already processed this PubOp, return empty map to avoid circular recursion
		if (processed.has(this.thisSymbol)) {
			return new Map();
		}

		const operations = new Map() as OperationsMap;
		processed.add(this.thisSymbol);

		// Add this pub's operations
		operations.set(this.getOperationKey(), {
			id: this.getInitialId(),
			mode: this.getMode(),
			values: this.collectValues(),
			relationsToAdd: [],
			relationsToRemove: [],
			relationsToClear: [],
		});

		// Process commands
		for (const cmd of this.commands) {
			const rootOp = operations.get(this.getOperationKey());
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
			} else if (cmd.type === "relate") {
				// Process each relation in the command
				cmd.relations.forEach((relation) => {
					if (!(relation.target instanceof BasePubOp)) {
						rootOp.relationsToAdd.push({
							slug: cmd.slug,
							value: relation.value,
							target: relation.target as PubsId,
							override: cmd.options.override,
							deleteOrphaned: cmd.options.deleteOrphaned,
						});
					} else {
						rootOp.relationsToAdd.push({
							slug: cmd.slug,
							value: relation.value,
							target: relation.target.thisSymbol,
							override: cmd.options.override,
							deleteOrphaned: cmd.options.deleteOrphaned,
						});

						// Collect nested PubOp operations
						if (!processed.has(relation.target.thisSymbol)) {
							const targetOps = relation.target.collectOperations(processed);
							for (const [key, value] of targetOps) {
								operations.set(key, value);
							}
						}
					}
				});
			}
		}

		return operations;
	}

	// Helper methods for operation collection
	protected abstract getMode(): OperationMode;
	protected abstract getInitialId(): PubsId | undefined;
	protected getOperationKey(): PubsId | symbol {
		return this.getInitialId() || this.thisSymbol;
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

	// Split executeWithTrx into smaller, focused methods
	protected async executeWithTrx(trx: Transaction<Database>): Promise<PubsId> {
		const operations = this.collectOperations();
		const idMap = await this.createAllPubs(trx, operations);
		await this.processRelations(trx, operations, idMap);
		await this.processValues(trx, operations, idMap);

		return this.resolvePubId(this.getOperationKey(), idMap);
	}

	private async createAllPubs(
		trx: Transaction<Database>,
		operations: OperationsMap
	): Promise<PubIdMap> {
		const idMap = new Map<PubsId | symbol, PubsId>();
		const pubsToCreate = Array.from(operations.entries()).map(([key, _]) => ({
			id: typeof key === "symbol" ? undefined : key,
			communityId: this.options.communityId,
			pubTypeId: this.options.pubTypeId,
		}));

		// Create pubs and handle conflicts
		const createdPubs = await autoRevalidate(
			trx
				.insertInto("pubs")
				.values(pubsToCreate)
				.onConflict((oc) => oc.columns(["id"]).doNothing())
				.returningAll()
		).execute();

		// Map IDs, handling both new and existing pubs
		let createdIndex = 0;
		let operationIndex = 0;
		for (const [key, op] of operations) {
			const createdPub = createdPubs[createdIndex];
			const pubToCreate = pubsToCreate[operationIndex];

			if (createdPub) {
				idMap.set(key, createdPub.id);
				createdIndex++;
			} else if (pubToCreate.id) {
				if (op.mode === "create") {
					throw new Error(
						`Cannot create a pub with an id that already exists: ${pubToCreate.id}`
					);
				}
				idMap.set(key, pubToCreate.id);
			} else if (typeof key === "symbol") {
				throw new Error("Pub not created");
			} else {
				idMap.set(key, key);
			}
			operationIndex++;
		}

		return idMap;
	}

	private async processRelations(
		trx: Transaction<Database>,
		operations: OperationsMap,
		idMap: PubIdMap
	): Promise<void> {
		for (const [key, op] of operations) {
			const pubId = this.resolvePubId(key, idMap);

			// Skip if no relation changes
			const modifications = {
				overrides: this.groupBySlug(op.relationsToAdd.filter((cmd) => cmd.override)),
				clears: this.groupBySlug(op.relationsToClear),
				removes: this.groupBySlug(op.relationsToRemove),
			};

			if (!this.hasModifications(modifications)) {
				continue;
			}

			// Find and remove existing relations
			const existingRelations = await trx
				.selectFrom("pub_values")
				.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
				.select(["pub_values.id", "relatedPubId", "pub_fields.slug"])
				.where("pubId", "=", pubId)
				.where("relatedPubId", "is not", null)
				.where("slug", "in", [
					...modifications.overrides.keys(),
					...modifications.clears.keys(),
					...modifications.removes.keys(),
				])
				.execute();

			const relationsToRemove = existingRelations.filter(
				(r) => !modifications.overrides.has(r.id)
			);

			if (relationsToRemove.length === 0) {
				return;
			}
			await deletePubValuesByValueId({
				pubId,
				valueIds: relationsToRemove.map((r) => r.id),
				lastModifiedBy: this.options.lastModifiedBy,
				trx,
			});

			// Handle orphaned pubs if needed
			await this.cleanupOrphanedPubs(trx, relationsToRemove, modifications);
		}
	}

	private async processValues(
		trx: Transaction<Database>,
		operations: OperationsMap,
		idMap: PubIdMap
	): Promise<void> {
		// Collect all values and relations to upsert
		const toUpsert = Array.from(operations.entries()).flatMap(([key, op]) => {
			const pubId = this.resolvePubId(key, idMap);
			return [
				// Regular values
				...op.values.map((v) => ({
					pubId,
					slug: v.slug,
					value: v.value,
				})),
				// Relations
				...op.relationsToAdd.map((r) => ({
					pubId,
					slug: r.slug,
					value: r.value,
					relatedPubId: typeof r.target === "string" ? r.target : idMap.get(r.target)!,
				})),
			];
		});

		if (toUpsert.length === 0) {
			return;
		}

		// Validate and upsert
		const validated = await validatePubValues({
			pubValues: toUpsert,
			communityId: this.options.communityId,
			continueOnValidationError: false,
			trx,
		});

		const { values, relations } = this.partitionValidatedValues(validated);

		// Perform upserts in parallel
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

	private hasModifications(mods: {
		[K in "overrides" | "clears" | "removes"]: ReturnType<typeof this.groupBySlug>;
	}): boolean {
		return mods.overrides.size > 0 || mods.clears.size > 0 || mods.removes.size > 0;
	}

	private groupBySlug<T extends { slug: string }>(items: T[]): Map<string, T[]> {
		return items.reduce((map, item) => {
			const existing = map.get(item.slug) ?? [];
			existing.push(item);
			map.set(item.slug, existing);
			return map;
		}, new Map<string, T[]>());
	}

	private async cleanupOrphanedPubs(
		trx: Transaction<Database>,
		removedRelations: Array<{ relatedPubId: PubsId | null }>,
		modifications: Record<string, Map<string, Array<{ deleteOrphaned?: boolean }>>>
	): Promise<void> {
		const shouldDelete = Object.values(modifications)
			.flatMap((m) => Array.from(m.values()))
			.flat()
			.some((m) => m.deleteOrphaned);

		if (!shouldDelete) return;

		const orphanedIds = removedRelations
			.map((r) => r.relatedPubId)
			.filter((id): id is PubsId => id !== null);

		if (orphanedIds.length === 0) return;

		const trulyOrphaned = await trx
			.selectFrom("pubs as p")
			.select("p.id")
			.leftJoin("pub_values as pv", "pv.relatedPubId", "p.id")
			.where("p.id", "in", orphanedIds)
			.groupBy("p.id")
			.having((eb) => eb.fn.count("pv.id"), "=", 0)
			.execute();

		if (trulyOrphaned.length > 0) {
			await deletePub({
				pubId: trulyOrphaned.map((p) => p.id),
				communityId: this.options.communityId,
				lastModifiedBy: this.options.lastModifiedBy,
				trx,
			});
		}
	}

	private partitionValidatedValues(validated: Array<any>) {
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
					(v): v is typeof v & { relatedPubId: PubsId } =>
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

	private resolvePubId(key: PubsId | symbol, idMap: Map<PubsId | symbol, PubsId>): PubsId {
		const pubId = typeof key === "symbol" ? idMap.get(key) : idMap.get(key);
		assert(pubId, "Pub ID is required");
		return pubId;
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
		super(options);
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
		super(options);
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
		id: PubsId | undefined,
		options: PubOpOptions,
		initialSlug?: string,
		initialValue?: PubValue
	) {
		super(options);
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

	static update(id: PubsId, options: PubOpOptions): UpdatePubOp {
		return new UpdatePubOp(id, options);
	}

	static updateByValue(slug: string, value: PubValue, options: PubOpOptions): UpdatePubOp {
		return new UpdatePubOp(undefined, options, slug, value);
	}

	static upsert(id: PubsId, options: PubOpOptions): UpsertPubOp {
		return new UpsertPubOp(options, id);
	}

	static upsertByValue(slug: string, value: PubValue, options: PubOpOptions): UpsertPubOp {
		return new UpsertPubOp(options, undefined, slug, value);
	}
}
