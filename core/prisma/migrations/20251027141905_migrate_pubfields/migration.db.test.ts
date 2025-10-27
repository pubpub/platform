import { sql } from "kysely";
import { describe, expect, test } from "vitest";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const migratePubfields = async (input: any) => {
	const trx = getTrx();
	const query = sql<{
		migrate_action_instance_pubfields: string;
	}>`SELECT migrate_action_instance_pubfields(${JSON.stringify(input)}::jsonb) as migrate_action_instance_pubfields`;

	const compiled = query.compile(trx);
	console.log(compiled.sql, compiled.parameters);

	const result = await query.execute(trx);
	return result.rows[0].migrate_action_instance_pubfields;
};

describe("migrate_action_instance_pubfields", () => {
	test("handles string fallback values", async () => {
		const input = {
			subject: "Hey jimmy!",
			pubFields: {
				subject: ["community:title"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: '{{ $.values.title :? "Hey jimmy!" }}',
		});
	});

	test("handles numeric fallback values", async () => {
		const input = {
			count: 42,
			pubFields: {
				count: ["community:count"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			count: "{{ $.values.count :? 42 }}",
		});
	});

	test("handles boolean fallback values", async () => {
		const input = {
			isPublic: true,
			pubFields: {
				isPublic: ["community:published"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			isPublic: "{{ $.values.published :? true }}",
		});
	});

	test("handles object fallback values", async () => {
		const input = {
			metadata: { foo: "bar", baz: 123 },
			pubFields: {
				metadata: ["community:data"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			metadata: '{{ $.values.data :? {"baz": 123, "foo": "bar"} }}',
		});
	});

	test("handles array fallback values", async () => {
		const input = {
			tags: ["alpha", "beta"],
			pubFields: {
				tags: ["community:keywords"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			tags: '{{ $.values.keywords :? ["alpha", "beta"] }}',
		});
	});

	test("handles missing fallback values", async () => {
		const input = {
			pubFields: {
				title: ["community:title"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			title: "{{ $.values.title }}",
		});
	});

	test("handles multiple keys with pubFields", async () => {
		const input = {
			subject: "Default Subject",
			body: "Default Body",
			count: 10,
			pubFields: {
				subject: ["community:title"],
				body: ["community:description"],
				count: ["community:counter"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: '{{ $.values.title :? "Default Subject" }}',
			body: '{{ $.values.description :? "Default Body" }}',
			count: "{{ $.values.counter :? 10 }}",
		});
	});

	test("ignores empty pubFields object", async () => {
		const input = {
			subject: "Hey jimmy!",
			pubFields: {},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: "Hey jimmy!",
			pubFields: {},
		});
	});

	test("ignores empty array in pubFields", async () => {
		const input = {
			subject: "Hey jimmy!",
			pubFields: {
				subject: [],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: "Hey jimmy!",
		});
	});

	test("ignores missing pubFields", async () => {
		const input = {
			subject: "Hey jimmy!",
			other: "value",
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: "Hey jimmy!",
			other: "value",
		});
	});

	test("preserves other config keys", async () => {
		const input = {
			subject: "Hey jimmy!",
			otherKey: "should stay",
			nested: {
				value: "also stays",
			},
			pubFields: {
				subject: ["community:title"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: '{{ $.values.title :? "Hey jimmy!" }}',
			otherKey: "should stay",
			nested: {
				value: "also stays",
			},
		});
	});

	test("handles null fallback values", async () => {
		const input = {
			value: null,
			pubFields: {
				value: ["community:field"],
			},
		};

		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			value: "{{ $.values.field :? null }}",
		});
	});

	test("handles multiple pubFields", async () => {
		const input = {
			subject: "Hey jimmy!",
			body: "Default Body",
			receiver: "John Doe",
			pubFields: {
				subject: ["community:title"],
				body: ["community:description"],
				receiver: [],
			},
		};
		const migrated = await migratePubfields(input);

		expect(migrated).toEqual({
			subject: '{{ $.values.title :? "Hey jimmy!" }}',
			body: '{{ $.values.description :? "Default Body" }}',
			receiver: "John Doe",
		});
	});
});
