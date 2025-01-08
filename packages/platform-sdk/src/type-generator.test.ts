import { describe, expect, expectTypeOf, it } from "vitest";

import type { PubFields, PubTypes, PubTypesId } from "db/public";
import { CoreSchemaType } from "db/public";

import type { Pub, PubType } from "./.generated-pubtypes";
import { isPubOfType, makeClient } from "./client";
import { generateTypeDefinitions } from "./type-generator";

export const pubTypeStub = [
	{
		id: "590c7a05-d35b-49eb-8f36-af99a7705be8",
		description: null,
		name: "Basic Pub",
		communityId: "0a17cfb2-c369-4f29-8dfd-92a51bb0ee71",
		createdAt: new Date(),
		updatedAt: new Date(),
		fields: [
			{
				id: "1a2e321a-c42a-4f24-b9cf-e66368382fdc",
				name: "Title",
				slug: "test-community:title",
				schemaName: "String",
				isRelation: false,
				isTitle: true,
				schema: null,
			},
			{
				id: "c6003a3c-7fc3-488d-8220-2f467ce4ff36",
				name: "Some relation",
				slug: "test-community:some-relation",
				schemaName: "String",
				isRelation: true,
				isTitle: false,
				schema: null,
			},
		],
	},
	{
		id: "6365dfe7-9839-4d88-baab-a7d479510acd",
		description: null,
		name: "Minimal Pub",
		communityId: "0a17cfb2-c369-4f29-8dfd-92a51bb0ee71",
		createdAt: new Date(),
		updatedAt: new Date(),
		fields: [
			{
				id: "1a2e321a-c42a-4f24-b9cf-e66368382fdc",
				name: "Title",
				slug: "test-community:title",
				schemaName: "String",
				isRelation: false,
				isTitle: true,
				schema: null,
			},
		],
	},
	{
		id: "a979056f-6b85-4aa3-9a8d-78855fdad956",
		description: null,
		name: "Everything Pub",
		communityId: "0a17cfb2-c369-4f29-8dfd-92a51bb0ee71",
		createdAt: new Date(),
		updatedAt: new Date(),
		fields: [
			{
				id: "1a2e321a-c42a-4f24-b9cf-e66368382fdc",
				name: "Title",
				slug: "test-community:title",
				schemaName: "String",
				isRelation: false,
				isTitle: true,
				schema: null,
			},
			{
				id: "c6003a3c-7fc3-488d-8220-2f467ce4ff36",
				name: "Some relation",
				slug: "test-community:some-relation",
				schemaName: "String",
				isRelation: true,
				isTitle: false,
				schema: null,
			},
			{
				id: "53713c81-66f2-446e-8164-8d4d419a978b",
				name: "Ok",
				slug: "test-community:ok",
				schemaName: "Boolean",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "7cac2f42-dd4d-4d1f-81e9-dd34c88bdeb1",
				name: "Number",
				slug: "test-community:number",
				schemaName: "Number",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "a496f1d2-17c8-4525-b7cd-8d4f42529564",
				name: "Date Time",
				slug: "test-community:date-time",
				schemaName: "DateTime",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "6c248f98-0535-4ca8-b8f2-31e665e481e6",
				name: "Url",
				slug: "test-community:url",
				schemaName: "URL",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "8b81da18-021b-4737-9a91-c13e924a9667",
				name: "Email",
				slug: "test-community:email",
				schemaName: "Email",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "382d81f1-1c5d-4a75-b79d-2adc4784854c",
				name: "Vector3",
				slug: "test-community:vector3",
				schemaName: "Vector3",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "4afbd428-3c5d-4766-815c-7f5a74a34404",
				name: "Numeric Array",
				slug: "test-community:numeric-array",
				schemaName: "NumericArray",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "4142263b-7d5d-4652-a8e3-562a690309fe",
				name: "String Array",
				slug: "test-community:string-array",
				schemaName: "StringArray",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "86f1d589-ce2c-45c8-978d-2907beb495ac",
				name: "Rich Text",
				slug: "test-community:rich-text",
				schemaName: "RichText",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "47c32939-02f3-4e32-9b5b-51484c20d82b",
				name: "Member",
				slug: "test-community:member",
				schemaName: "MemberId",
				isRelation: false,
				isTitle: false,
				schema: null,
			},
			{
				id: "fc498e7a-ef06-463e-aed5-83a329fb0b07",
				name: "Fun Relation",
				slug: "test-community:fun-relation",
				schemaName: "Null",
				isRelation: true,
				isTitle: false,
				schema: null,
			},
		],
	},
] as unknown as (PubTypes & { fields: (PubFields & { isTitle: true })[] })[];

describe("exportPubTypes", () => {
	it("should be able to export pub types", async () => {
		const path = new URL(".generated-pubtypes.ts", import.meta.url).pathname;

		const pubTypes = await generateTypeDefinitions(pubTypeStub, path);

		expect(pubTypes).toMatchSnapshot();
	});

	it("hngg", async () => {
		let pub = {} as unknown as Pub;

		if (pub.pubTypeName === "Everything Pub") {
			pub.values;
		}
	});
});

declare const client: ReturnType<typeof makeClient<{ Pub: Pub; PubType: PubType }>>;

const pubTypeNames = ["Basic Pub", "Minimal Pub", "Everything Pub"] as const;

describe("type tests", () => {
	describe("pub", () => {
		it("test pub Get return ", async () => {
			type PubGetReturn = Awaited<ReturnType<typeof client.pubs.get>>;

			const pub = {} as unknown as PubGetReturn;

			if (pub.status !== 200) {
				// for get body is only defined on 200
				expectTypeOf(pub.body).toEqualTypeOf<unknown>();
				return;
			}

			expectTypeOf(pub.body.pubTypeName).toMatchTypeOf<(typeof pubTypeNames)[number]>();

			if (pub.body.pubType.name === "Basic Pub") {
				pub.body.values.map((value) => {
					// this type narrowing shouldn't work
					expectTypeOf(value.fieldName).not.toEqualTypeOf<"Title" | "Some relation">();
				});
			}

			// you need to use the type guard to get the type narrowing
			if (isPubOfType(pub.body, "Basic Pub")) {
				pub.body.values.map((value) => {
					expectTypeOf(value.fieldName).toEqualTypeOf<"Title" | "Some relation">();
				});
			} else if (isPubOfType(pub.body, "Everything Pub")) {
				pub.body.values.map((value) => {
					expectTypeOf(value.fieldName).toEqualTypeOf<
						| "Title"
						| "Some relation"
						| "Ok"
						| "Number"
						| "Date Time"
						| "Url"
						| "Email"
						| "Vector3"
						| "Numeric Array"
						| "String Array"
						| "Rich Text"
						| "Member"
						| "Fun Relation"
					>();

					// this tests whether you can get the type of a field by their fieldname
					switch (value.fieldName) {
						case "Title":
							expectTypeOf(value.value).toEqualTypeOf<string>();
							// non relation fields should not have a relatedPub or relatedPubId
							expectTypeOf(value.relatedPub).toEqualTypeOf<never | undefined>();
							expectTypeOf(value.relatedPubId).toEqualTypeOf<null>();
							break;
						case "Some relation":
							// relations should have a relatedPubId and possibly a relatedPub
							expectTypeOf(value.relatedPubId).toEqualTypeOf<PubTypesId | null>();
							expectTypeOf(value.relatedPub).toEqualTypeOf<Pub | null>();
							break;
						case "Ok":
							expectTypeOf(value.value).toEqualTypeOf<boolean>();
							break;
						case "Number":
							expectTypeOf(value.value).toEqualTypeOf<number>();
							break;
						case "Date Time":
							// hmm, maybe this should be a string, unless we hydrate values on the client
							expectTypeOf(value.value).toEqualTypeOf<Date>();
							break;
						case "Url":
							expectTypeOf(value.value).toEqualTypeOf<string>();
							break;
						case "Email":
							expectTypeOf(value.value).toEqualTypeOf<string>();
							break;

						case "Vector3":
							expectTypeOf(value.value).toEqualTypeOf<[number, number, number]>();
							break;
						case "Numeric Array":
							expectTypeOf(value.value).toEqualTypeOf<number[]>();
							break;
						case "String Array":
							expectTypeOf(value.value).toEqualTypeOf<string[]>();
							break;
						case "Rich Text":
							expectTypeOf(value.value).toEqualTypeOf<{
								content: unknown[];
								type: "doc";
							}>();
							break;
						case "Member":
							expectTypeOf(value.value).toEqualTypeOf<string>();
							break;
						case "Fun Relation":
							expectTypeOf(value.value).toEqualTypeOf<null>();
							expectTypeOf(value.relatedPubId).toEqualTypeOf<PubTypesId | null>();
							expectTypeOf(value.relatedPub).toEqualTypeOf<Pub | null>();
							break;

						default:
							const _exhaustiveCheck: never = value;
							break;
					}

					// this checks whether you can get the type of a field by its CoreSchematype
					switch (value.schemaName) {
						case CoreSchemaType.Boolean:
							expectTypeOf(value.value).toEqualTypeOf<boolean>();
							expectTypeOf(value.fieldName).toEqualTypeOf<"Ok">();
							break;
						case CoreSchemaType.String:
							expectTypeOf(value.value).toEqualTypeOf<string>();
							expectTypeOf(value.fieldName).toEqualTypeOf<
								"Title" | "Some relation"
							>();
							break;
						// don't feel like testing everything here, it's mostly the same as above
						default:
							break;
					}

					switch (value.fieldSlug) {
						case "test-community:numeric-array":
							expectTypeOf(value.value).toEqualTypeOf<number[]>();
							expectTypeOf(value.fieldName).toEqualTypeOf<"Numeric Array">();
							break;
						default:
							break;
					}
				});
			}
		});
	});

	describe("pubType", () => {
		it("test pubType Get return ", async () => {
			type PubTypeGetReturn = Awaited<ReturnType<typeof client.pubTypes.get>>;

			const pubType = {} as unknown as PubTypeGetReturn;

			if (pubType.status !== 200) {
				expectTypeOf(pubType.body).toEqualTypeOf<unknown>();
				return;
			}

			expectTypeOf(pubType.body.name).toMatchTypeOf<(typeof pubTypeNames)[number]>();

			if (pubType.body.name === "Basic Pub") {
				pubType.body.fields.map((field) => {
					expectTypeOf(field.name).toEqualTypeOf<"Title" | "Some relation">();
				});
			}
		});
	});
});
