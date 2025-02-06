import type { Transaction } from "kysely";

import { sql } from "kysely";

import type { JsonValue, ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type { CommunitiesId, CoreSchemaType, PubFieldsId, PubsId, PubTypesId } from "db/public";
import type { LastModifiedBy } from "db/types";
import { assert, expect } from "utils";
import { isUuid } from "utils/uuid";

import { db } from "~/kysely/database";
import { autoRevalidate } from "./cache/autoRevalidate";
import {
	getPubsWithRelatedValuesAndChildren,
	maybeWithTrx,
	upsertPubRelationValues,
	upsertPubValues,
	validatePubValues,
} from "./pub";

type PubValue = string | number | boolean | JsonValue;
type SetCommand = { type: "set"; slug: string; value: PubValue };
type RelateCommand = {
	type: "relate";
	slug: string;
	value: PubValue;
	target: PubOp | PubsId;
	override?: boolean;
	deleteOrphaned?: boolean;
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

type PubOpCommand = SetCommand | RelateCommand | DisconnectCommand | ClearRelationsCommand;

type PubOpOptions = {
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	lastModifiedBy: LastModifiedBy;
	trx?: Transaction<Database>;
};

type OperationsMap = Map<
	PubsId | symbol,
	{
		id?: PubsId;
		mode: "create" | "upsert";
		values: Omit<SetCommand, "type">[];
		relationsToAdd: (Omit<RelateCommand, "type" | "target"> & { target: PubsId | symbol })[];
		relationsToRemove: (Omit<DisconnectCommand, "type"> & { target: PubsId })[];
		relationsToClear: (Omit<ClearRelationsCommand, "type"> & { slug: string })[];
	}
>;

function isPubId(val: string | PubsId): val is PubsId {
	return isUuid(val);
}

export class PubOp {
	readonly #options: PubOpOptions;
	readonly #commands: PubOpCommand[] = [];
	readonly #mode: "create" | "upsert" = "create";
	readonly #initialId?: PubsId;
	readonly #initialslug?: string;
	readonly #initialValue?: PubValue;
	readonly #thisSymbol: symbol;
	static #symbolCounter = 0;

	private constructor(
		options: PubOpOptions,
		mode: "create" | "upsert",
		initialId?: PubsId,
		initialslug?: string,
		initialValue?: PubValue,
		commands: PubOpCommand[] = []
	) {
		this.#options = options;
		this.#mode = mode;
		this.#initialId = initialId;
		this.#initialslug = initialslug;
		this.#initialValue = initialValue;
		this.#commands = commands;
		this.#thisSymbol = Symbol(`pub-${PubOp.#symbolCounter++}`);
	}

	static createWithId(id: PubsId, options: PubOpOptions): PubOp {
		return new PubOp(options, "create", id);
	}

	static create(options: PubOpOptions): PubOp {
		return new PubOp(options, "create");
	}

	static upsert(id: PubsId, options: PubOpOptions): PubOp;
	static upsert(slug: string, value: PubValue, options: PubOpOptions): PubOp;
	static upsert(
		slugOrId: string | PubsId,
		valueOrOptions: PubValue | PubOpOptions,
		options?: PubOpOptions
	): PubOp {
		if (isPubId(slugOrId)) {
			return new PubOp(valueOrOptions as PubOpOptions, "upsert", slugOrId);
		}
		return new PubOp(options!, "upsert", undefined, slugOrId, valueOrOptions as PubValue);
	}

	/**
	 * Add a single value to this pub
	 * The slug is the field slug of format `[communitySlug]:[fieldSlug]`
	 */
	set(slug: string, value: PubValue): this;
	/**
	 * Add multiple values to this pub
	 * The keys are the field slugs of format `[communitySlug]:[fieldSlug]`
	 */
	set(values: Record<string, PubValue>): this;
	set(slugOrValues: string | Record<string, PubValue>, value?: PubValue): this {
		if (typeof slugOrValues === "string") {
			this.#commands.push({
				type: "set",
				slug: slugOrValues,
				value: value!,
			});
		} else {
			this.#commands.push(
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
	 * Relate this pub to another pub
	 * @param slug The field slug
	 * @param value The value for this relation
	 * @param target The pub to relate to
	 * @param options Additional options for this relation
	 */
	relate(
		slug: string,
		value: PubValue,
		target: PubOp | PubsId,
		options?: {
			override?: boolean;
			deleteOrphaned?: boolean;
		}
	): this {
		this.#commands.push({
			type: "relate",
			slug,
			value,
			target,
			override: options?.override,
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}

	/**
	 * Remove a specific relation from this pub
	 */
	disconnect(slug: string, target: PubsId, options?: { deleteOrphaned?: boolean }): this {
		this.#commands.push({
			type: "disconnect",
			slug,
			target,
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}

	/**
	 * Clear all relations for specified field(s)
	 */
	clearRelations(options?: { slug?: string; deleteOrphaned?: boolean }): this {
		this.#commands.push({
			type: "clearRelations",
			slug: options?.slug,
			deleteOrphaned: options?.deleteOrphaned,
		});
		return this;
	}

	private collectAllOperations(processed = new Set<symbol>()): OperationsMap {
		// If we've already processed this PubOp, return empty map to avoid circular recursion
		if (processed.has(this.#thisSymbol)) {
			return new Map();
		}

		const operations = new Map() as OperationsMap;
		processed.add(this.#thisSymbol);

		operations.set(this.#initialId || this.#thisSymbol, {
			id: this.#initialId,
			mode: this.#mode,
			values: [
				// if we use a value rather than the id as the unique identifier
				...(this.#initialslug
					? [{ slug: this.#initialslug, value: this.#initialValue! }]
					: []),
				...this.#commands
					.filter(
						(cmd): cmd is Extract<PubOpCommand, { type: "set" }> => cmd.type === "set"
					)
					.map((cmd) => ({
						slug: cmd.slug,
						value: cmd.value,
					})),
			],
			relationsToAdd: [],
			relationsToRemove: [],
			relationsToClear: [],
		});

		for (const cmd of this.#commands) {
			if (cmd.type === "set") {
				continue;
			}

			const rootOp = operations.get(this.#initialId || this.#thisSymbol);
			assert(rootOp, "Root operation not found");

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
			} else if (!(cmd.target instanceof PubOp)) {
				rootOp.relationsToAdd.push({
					slug: cmd.slug,
					value: cmd.value,
					target: cmd.target,
					override: cmd.override,
					deleteOrphaned: cmd.deleteOrphaned,
				});
			} else {
				rootOp.relationsToAdd.push({
					slug: cmd.slug,
					value: cmd.value,
					target: cmd.target.#initialId || cmd.target.#thisSymbol,
					override: cmd.override,
					deleteOrphaned: cmd.deleteOrphaned,
				});

				// Only collect target operations if we haven't processed it yet
				// to prevent infinite loops
				if (!processed.has(cmd.target.#thisSymbol)) {
					const targetOps = cmd.target.collectAllOperations(processed);
					for (const [key, value] of targetOps) {
						operations.set(key, value);
					}
				}
			}
		}

		return operations;
	}

	private async executeWithTrx(trx: Transaction<Database>): Promise<PubsId> {
		const operations = this.collectAllOperations();
		const idMap = new Map<PubsId | symbol, PubsId>();

		const pubsToCreate = [] as {
			id: PubsId | undefined;
			communityId: CommunitiesId;
			pubTypeId: PubTypesId;
		}[];

		for (const [key, value] of operations) {
			pubsToCreate.push({
				id: typeof key === "symbol" ? undefined : key,
				communityId: this.#options.communityId,
				pubTypeId: this.#options.pubTypeId,
			});
		}

		// we create the necessary pubs
		const pubCreateResult = await autoRevalidate(
			trx
				.insertInto("pubs")
				.values(pubsToCreate)
				.onConflict((oc) => oc.columns(["id"]).doNothing())
				.returningAll()
		).execute();

		let index = 0;
		/**
		 * this is somewhat convoluted, but basically:
		 * - onConflict().doNothing() does not return anything if it's triggered
		 * - therefore we need to fill in the "holes" in the pubCreateResult array
		 * in order to effectively loop over it by comparing it with the operations
		 */
		const pubCreateResultWithHolesFilled = pubsToCreate.map((pubToCreate) => {
			const correspondingPubCreateResult = pubCreateResult[index];

			if (pubToCreate.id && pubToCreate.id !== correspondingPubCreateResult?.id) {
				return null;
			}

			index++;

			if (correspondingPubCreateResult) {
				return correspondingPubCreateResult;
			}

			return null;
		});

		let idx = 0;
		for (const [key, op] of operations) {
			let result = pubCreateResultWithHolesFilled[idx];

			if (result) {
				idMap.set(key, result.id);
				idx++;
				continue;
			}

			// we are upserting a pub, OR we are creating a pub with a specific id that has failed
			const possiblyExistingPubId = pubsToCreate[idx]?.id;

			if (possiblyExistingPubId && op.mode === "create") {
				throw new Error(
					`Cannot create a pub with an id that already exists: ${possiblyExistingPubId}`
				);
			}

			if (possiblyExistingPubId) {
				idMap.set(key, possiblyExistingPubId);
				idx++;
				continue;
			}

			if (typeof key === "symbol") {
				throw new Error("Pub not created");
			}
			idMap.set(key, key);

			idx++;
		}

		const rootId = this.#initialId || idMap.get(this.#thisSymbol)!;
		assert(rootId, "Root ID should exist");

		// First handle relation clearing/disconnections
		for (const [key, op] of operations) {
			const pubId = typeof key === "symbol" ? idMap.get(key) : idMap.get(key);
			assert(pubId, "Pub ID is required");

			// Process relate commands with override
			const overrideRelateCommands = op.relationsToAdd?.filter((cmd) => !!cmd.override) ?? [];

			// Group by slug for override operations
			const overridesBySlug = new Map<
				string,
				(Omit<RelateCommand, "type" | "target"> & { target: PubsId | symbol })[]
			>();

			for (const cmd of overrideRelateCommands) {
				const cmds = overridesBySlug.get(cmd.slug) ?? [];
				cmds.push(cmd);
				overridesBySlug.set(cmd.slug, cmds);
			}

			// Handle all disconnections
			if (
				op.relationsToClear.length > 0 ||
				op.relationsToRemove.length > 0 ||
				overridesBySlug.size > 0
			) {
				// Build query to find relations to remove
				const query = trx
					.selectFrom("pub_values")
					.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
					.select(["pub_values.id", "relatedPubId", "pub_fields.slug"])
					.where("pubId", "=", pubId)
					.where("relatedPubId", "is not", null);

				// Add slug conditions
				const slugConditions = [
					...op.relationsToClear.map((cmd) => cmd.slug).filter(Boolean),
					...op.relationsToRemove.map((cmd) => cmd.slug),
					...overridesBySlug.keys(),
				];

				if (slugConditions.length > 0) {
					query.where("slug", "in", slugConditions);
				}

				const existingRelations = await query.execute();

				// Determine which relations to remove
				const relationsToRemove = existingRelations.filter((rel) => {
					// Remove if explicitly disconnected
					if (
						op.relationsToRemove.some(
							(cmd) => cmd.slug === rel.slug && cmd.target === rel.relatedPubId
						)
					) {
						return true;
					}

					// Remove if field is being cleared
					if (op.relationsToClear.some((cmd) => !cmd.slug || cmd.slug === rel.slug)) {
						return true;
					}

					// Remove if not in override set
					const overrides = overridesBySlug.get(rel.slug);
					if (
						overrides &&
						!overrides.some(
							(cmd) =>
								(typeof cmd.target === "string"
									? cmd.target
									: idMap.get(cmd.target)) === rel.relatedPubId
						)
					) {
						return true;
					}

					return false;
				});

				// Remove the relations
				if (relationsToRemove.length > 0) {
					await trx
						.deleteFrom("pub_values")
						.where(
							"pub_values.id",
							"in",
							relationsToRemove.map((r) => r.id)
						)
						.execute();

					// Handle orphaned pubs if requested
					const shouldCheckOrphaned = [
						...op.relationsToClear,
						...op.relationsToRemove,
						...overrideRelateCommands,
					].some((cmd) => cmd.deleteOrphaned);

					if (shouldCheckOrphaned) {
						const orphanedPubIds = relationsToRemove
							.map((r) => r.relatedPubId!)
							.filter(Boolean);

						if (orphanedPubIds.length > 0) {
							// Find and delete truly orphaned pubs
							const orphanedPubs = await trx
								.selectFrom("pubs as p")
								.select("p.id")
								.leftJoin("pub_values as pv", "pv.relatedPubId", "p.id")
								.where("p.id", "in", orphanedPubIds)
								.groupBy("p.id")
								.having((eb) => eb.fn.count("pv.id"), "=", 0)
								.execute();

							if (orphanedPubs.length > 0) {
								await trx
									.deleteFrom("pubs")
									.where(
										"id",
										"in",
										orphanedPubs.map((p) => p.id)
									)
									.execute();
							}
						}
					}
				}
			}
		}

		const valuesToUpsert = [] as {
			pubId: PubsId;
			slug: string;
			value: PubValue;
		}[];

		const relationValuesToUpsert = [] as {
			pubId: PubsId;
			slug: string;
			value: PubValue;
			relatedPubId: PubsId;
		}[];

		for (const [key, op] of operations) {
			const pubId = typeof key === "symbol" ? idMap.get(key) : idMap.get(key);

			assert(pubId, "Pub ID is required");

			if (op.values.length > 0) {
				valuesToUpsert.push(
					...op.values.map((v) => ({
						pubId,
						slug: v.slug,
						value: v.value,
					}))
				);
			}

			if (op.relationsToAdd.length > 0) {
				relationValuesToUpsert.push(
					...op.relationsToAdd.map((r) => ({
						pubId,
						slug: r.slug,
						value: r.value,
						relatedPubId: expect(
							typeof r.target === "string" ? r.target : idMap.get(r.target),
							"Related pub ID should exist"
						),
					}))
				);
			}
		}

		if (valuesToUpsert.length === 0 && relationValuesToUpsert.length === 0) {
			return rootId;
		}

		// kind of clunky, but why do it twice when we can do it once
		const validatedPubAndRelationValues = await validatePubValues({
			pubValues: [...valuesToUpsert, ...relationValuesToUpsert],
			communityId: this.#options.communityId,
			continueOnValidationError: false,
			trx,
		});

		const validatedPubValues = validatedPubAndRelationValues
			.filter((v) => !("relatedPubId" in v) || !v.relatedPubId)
			.map((v) => ({
				pubId: v.pubId,
				fieldId: v.fieldId,
				value: v.value,
				lastModifiedBy: this.#options.lastModifiedBy,
			}));
		const validatedRelationValues = validatedPubAndRelationValues
			.filter(
				(v): v is typeof v & { relatedPubId: PubsId } =>
					"relatedPubId" in v && !!v.relatedPubId
			)
			.map((v) => ({
				pubId: v.pubId,
				fieldId: v.fieldId,
				value: v.value,
				relatedPubId: v.relatedPubId,
				lastModifiedBy: this.#options.lastModifiedBy,
			}));

		await Promise.all([
			upsertPubValues({
				// this is a dummy pubId, we will use the ones on the validatedPubValues
				pubId: "xxx" as PubsId,
				pubValues: validatedPubValues,
				lastModifiedBy: this.#options.lastModifiedBy,
				trx,
			}),
			upsertPubRelationValues({
				// this is a dummy pubId, we will use the ones on the validatedPubRelationValues
				pubId: "xxx" as PubsId,
				allRelationsToCreate: validatedRelationValues,
				lastModifiedBy: this.#options.lastModifiedBy,
				trx,
			}),
		]);

		return rootId;
	}

	async execute(): Promise<ProcessedPub> {
		const { trx = db } = this.#options;

		const pubId = await maybeWithTrx(trx, async (trx) => {
			return await this.executeWithTrx(trx);
		});

		return await getPubsWithRelatedValuesAndChildren(
			{ pubId, communityId: this.#options.communityId },
			{ trx }
		);
	}
}
