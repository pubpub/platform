import type { OperationNode, RootOperationNode } from "kysely";

import {
	DummyDriver,
	Kysely,
	OnConflictNode,
	PostgresAdapter,
	PostgresDialect,
	PostgresIntrospector,
	PostgresQueryCompiler,
	QueryNode,
} from "kysely";
import { describe, expect, expectTypeOf, it } from "vitest";

import type { Database } from "db/Database";
import type { CommunitiesId, PubTypesId } from "db/public";

import { UpdatedAtPlugin } from "./updated-at-plugin";

const mockedDb = new Kysely<Database>({
	dialect: {
		createAdapter: () => new PostgresAdapter(),
		createDriver: () => new DummyDriver(),
		createIntrospector: (db) => new PostgresIntrospector(db),
		createQueryCompiler: () => new PostgresQueryCompiler(),
	},
});

function assertNodeKind<K extends OperationNode["kind"]>(
	received: RootOperationNode,
	kind: K
): asserts received is Extract<RootOperationNode, { kind: K }> {
	expect(received.kind).toBe(kind);
	if (received.kind !== kind) {
		throw new Error(`Expected node kind to be ${kind} but got ${received.kind}`);
	}
}

describe("UpdatedAtPlugin", () => {
	it("should add updatedAt column to update query", () => {
		const simpleUpdate = mockedDb.updateTable("pubs").set({
			title: "test",
		});

		const simpleUpdateNode = simpleUpdate.compile().query;

		assertNodeKind(simpleUpdateNode, "UpdateQueryNode");
		expect(simpleUpdateNode.updates?.length).toBe(1);

		const plugin = new UpdatedAtPlugin(["pubs"]);
		const withPlugin = simpleUpdate.withPlugin(plugin);

		const transformed = withPlugin.compile().query;

		assertNodeKind(transformed, "UpdateQueryNode");
		expect(transformed.updates?.length).toBe(2);
	});

	it("should not add updatedAt column to update query if table is not in list", () => {
		const simpleUpdate = mockedDb.updateTable("pubs").set({
			title: "test",
		});

		const plugin = new UpdatedAtPlugin(["users"]);
		const withPlugin = simpleUpdate.withPlugin(plugin);

		const transformed = withPlugin.compile().query;

		assertNodeKind(transformed, "UpdateQueryNode");
		expect(transformed.updates?.length).toBe(1);
	});

	it("should add updatedAt column to onConflictUpdate doUpdate", () => {
		const simpleUpdate = mockedDb
			.insertInto("pubs")
			.values({
				title: "test",
				communityId: "X" as CommunitiesId,
				pubTypeId: "X" as PubTypesId,
			})
			.onConflict((b) =>
				b.doUpdateSet((eb) => ({
					title: eb.ref("excluded.title"),
				}))
			);

		const transformed = simpleUpdate.compile().query;

		assertNodeKind(transformed, "InsertQueryNode");
		expect(transformed.onConflict?.updates?.length).toBe(1);

		const plugin = new UpdatedAtPlugin(["pubs"]);

		const transformedWithPlugin = simpleUpdate.withPlugin(plugin).compile().query;

		assertNodeKind(transformedWithPlugin, "InsertQueryNode");
		const { onConflict } = transformedWithPlugin;
		expect(onConflict?.updates?.length).toBe(2);

		expect(onConflict?.updates?.[0].kind).toBe("ColumnUpdateNode");
	});

	it("should not add updateAt column to any other kind of query", () => {
		const simpleInsert = mockedDb.insertInto("pubs").values({
			title: "test",
			communityId: "X" as CommunitiesId,
			pubTypeId: "X" as PubTypesId,
		});

		const transformed = simpleInsert.compile().query;

		assertNodeKind(transformed, "InsertQueryNode");
		// @ts-expect-error
		expect(transformed.updates).toBeUndefined();

		const simpleSelect = mockedDb.selectFrom("pubs").selectAll();

		const transformedSelect = simpleSelect.compile().query;

		assertNodeKind(transformedSelect, "SelectQueryNode");
		// @ts-expect-error
		expect(transformedSelect.updates).toBeUndefined();
	});
});
