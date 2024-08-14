import type { Insertable, Selectable } from "kysely";

import { faker } from "@faker-js/faker";

import type { CommunitiesId, MembersId, PublicSchema, StagesId, UsersId } from "db/public";
import {
	ApiAccessScope,
	ApiAccessType,
	ElementType,
	MemberRole,
	StructuralFormElement,
} from "db/public";
import { databaseTables } from "db/table-names";
import { assert } from "utils";

import { db } from "../kysely/database";
import { createPasswordHash } from "./auth/password";
import { slugifyString } from "./string";

export type PickLoose<T extends Record<string, any>, S extends string> = {
	[K in keyof T as K extends S ? K : never]: T[K];
};

export type OptionalBy<T extends Record<string, any>, K extends keyof T> = Pick<Partial<T>, K> &
	Omit<T, K>;

export type OptionalByLoose<T extends Record<string, any>, S extends string> = {
	[K in keyof T as K extends S ? K : never]?: T[K];
} & {
	[K in keyof T as K extends S ? never : K]: T[K];
};

export type RequireBy<T extends Record<string, any>, K extends keyof T> = Pick<Required<T>, K> &
	Omit<T, K>;

export type RequireByLoose<T extends Record<string, any>, S extends string> = {
	[K in keyof T as K extends S ? K : never]-?: T[K];
} & {
	[K in keyof T as K extends S ? never : K]: T[K];
};

type DBTableName = keyof PublicSchema;

type SelectableTable<T extends keyof PublicSchema> = Selectable<PublicSchema[T]>;

type ThingsThatHaveAKeywithTheSameTypeAsThisThingsIdKey<
	T extends DBTableName,
	S extends SelectableTable<T> = SelectableTable<T>,
	NonTDBTableName extends Exclude<DBTableName, T> = Exclude<DBTableName, T>,
> = "id" extends keyof S
	? NonTDBTableName extends keyof PublicSchema
		? SelectableTable<NonTDBTableName> extends infer DBT
			? {
					[K in Exclude<keyof DBT, "id"> as DBT[K] extends S["id"] ? K : never]: true;
				} extends infer M
				? keyof M extends never
					? never
					: [NonTDBTableName, keyof M]
				: "a"
			: // }[Exclude<keyof DBT, "id">] extends true
				// ? SelectableDBTable
				// : "a"
				"c"
		: "d"
	: "e";

type PropertiesThatHaveAKeywithTheSameTypeAsThisThingsIdKey<
	T extends DBTableName,
	S extends SelectableTable<T> = SelectableTable<T>,
	NonTDBTableName extends Exclude<DBTableName, T> = Exclude<DBTableName, T>,
> = "id" extends keyof S
	? NonTDBTableName extends keyof PublicSchema
		? SelectableTable<NonTDBTableName> extends infer DBT
			? {
					[K in Exclude<keyof DBT, "id"> as DBT[K] extends S["id"] ? K : never]: true;
				} extends infer M
				? keyof M extends never
					? never
					: keyof M
				: never
			: // }[Exclude<keyof DBT, "id">] extends true
				// ? SelectableDBTable
				// : "a"
				never
		: never
	: never;

type X = ThingsThatHaveAKeywithTheSameTypeAsThisThingsIdKey<"communities">;
//   ^?

type SpecialRelations = {
	pubs: "stages" | "permissions";
	stages: "permissions" | "pubs";
	forms: "permissions";
	permissions: "forms" | "stages" | "pubs";
	pub_fields: "pub_types";
	pub_types: "pub_fields";
};

type OptionalExcept<T extends Record<string, any>, S extends string> = PickLoose<T, S> &
	Partial<Omit<T, S>>;

/**
 * Makes all properties in T optional except properties matching
 * - `${string}Id`
 * - "A"
 * - "B"
 *
 * These all indicate relations and are required when instantiating a new object, except when they are in the PrevKeys
 * in which case they are optional as well.
 *
 */
type OnlyRequiredRelations<
	T extends Record<string, any>,
	PrevKeys extends string = "",
> = OptionalByLoose<OptionalExcept<T, `${string}Id` | "A" | "B">, PrevKeys>;

type Ins<
	T extends DBTableName,
	PrevKeys extends string = "",
	I extends Insertable<PublicSchema[T]> = Insertable<PublicSchema[T]>,
> = OnlyRequiredRelations<I, PrevKeys>;

type Creatable<T extends DBTableName, PrevKeys extends string = ""> = Ins<T, PrevKeys> &
	(PropertiesThatHaveAKeywithTheSameTypeAsThisThingsIdKey<T> extends infer Properties extends
		string
		? // for TName in TName
			DBTableName extends infer DBTN extends keyof PublicSchema
			? {
					[K in DBTN]?: PrevKeys extends string
						? Creatable<K, PrevKeys | Properties> extends infer C
							? C | C[]
							: never
						: never;
				}
			: never
		: never);

type TopLevelThing<T extends DBTableName = DBTableName> = T extends T
	? {
			[K in T]?: Creatable<T, "id"> extends infer C ? C | C[] : never;
		}
	: never;

const l = {
	communities: [
		{
			id: "xxxx" as CommunitiesId,
			name: "Test Community",
			users: [
				{
					id: "user-1" as UsersId,
					firstName: "jimoty",
					lastName: "jimoty",
					members: [
						{
							id: "user-1-member-1" as MembersId,
							role: MemberRole.contributor,
						},
					],
					api_access_tokens: [
						{
							api_access_permissions: [
								{
									scope: ApiAccessScope.community,
									accessType: ApiAccessType.write,
								},
							],
						},
					],
				},
			],
			pub_types: [
				{
					name: "Submission",
					forms: [
						{
							name: "Submission Form",
							permissions: {
								memberId: "user-1-member-1" as MembersId,
								form_to_permissions: {},
							},
						},
					],
				},
			],
			stages: [
				{
					id: "source" as StagesId,
					name: "Beginning",
				},
				{
					id: "xxxx1" as StagesId,
					move_constraint: [
						{
							stageId: "source" as StagesId,
							destinationId: "xxxx1" as StagesId,
						},
					],
				},
			],
		},
	],
} as const satisfies TopLevelThing;

type Factory<T extends DBTableName> = (props: Ins<T>) => Promise<SelectableTable<T>>;

const factories = {
	communities: async (props) => {
		const name = faker.company.name();
		const slug = slugifyString(name);

		return db
			.insertInto("communities")
			.values({
				name: name,
				slug: slug,
				avatar: faker.image.avatar(),
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	pubs: async (props) => {
		return db
			.insertInto("pubs")
			.values({
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	pub_types: async (props) => {
		return db
			.insertInto("pub_types")
			.values({
				name: faker.word.noun(),
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	pub_fields: async (props) => {
		const name = faker.word.noun();
		return db
			.insertInto("pub_fields")
			.values({
				name,
				slug: slugifyString(name),
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	pub_values: async (props) => {
		return db
			.insertInto("pub_values")
			.values({
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	forms: async (props) => {
		const name = faker.word.noun();
		return db
			.insertInto("forms")
			.values({
				name,
				slug: slugifyString(name),
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	form_elements: async (props) => {
		const type = !props.type ? ElementType.structural : ElementType.pubfield;
		const element = type === ElementType.structural ? StructuralFormElement.p : undefined;
		const content = !props.type ? faker.lorem.paragraph() : undefined;

		return db
			.insertInto("form_elements")
			.values({
				type,
				element,
				content,
				order: 0,
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
	users: async (props) => {
		const firstName = faker.name.firstName();
		const lastName = faker.name.lastName();

		const slug = slugifyString(firstName + lastName);

		return db
			.insertInto("users")
			.values({
				email: faker.internet.email(),
				passwordHash: await createPasswordHash("pubpub-test"),
				avatar: faker.image.avatar(),
				firstName,
				lastName,
				slug,
				...props,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	},
} as const satisfies {
	[K in DBTableName]?: Factory<K>;
};

const filterTableNames = <T extends Record<string, any>>(props: T) => {
	return Object.entries(props).reduce(
		(acc, [key, value]) => {
			if (databaseTables.includes(key as DBTableName)) {
				acc["tables"][key] = value;
				return acc;
			}

			acc["values"][key] = value;
			return acc;
		},
		{ tables: {} as Pick<T, DBTableName>, values: {} as Omit<T, DBTableName> }
	);
};

async function createSeed<T extends TopLevelThing>(t: T) {
	const things = Object.entries(t) as [DBTableName, Creatable<DBTableName>][];

	for (const thing of things) {
		const { tables, values } = filterTableNames(thing);

		for (const table of Object.keys(tables)) {
			const tableName = table as DBTableName;
			const tableValues = tables[tableName];

			await factories[tableName]({ ...tableValues, ...values });
		}
	}

	return t;
}
