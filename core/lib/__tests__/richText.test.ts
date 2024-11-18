import { getPubValues } from "context-editor";
import { describe, expect, it, vi } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { parseRichTextForPubFieldsAndRelatedPubs } from "../fields/richText";

vi.mock("context-editor", () => ({
	getPubValues: vi.fn(),
	baseSchema: {
		nodeFromJSON: vi.fn(),
	},
}));

describe("parseRichTextForPubFieldsAndRelatedPubs", () => {
	const pubId = crypto.randomUUID() as PubsId;
	it("should do nothing if there is no rich text field", () => {
		const values = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String, value: "my title" },
			{ slug: "croccroc:content", schemaName: CoreSchemaType.String, value: "my content" },
		];
		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual([
			{
				slug: "croccroc:title",
				value: "my title",
			},
			{ slug: "croccroc:content", value: "my content" },
		]);
	});

	it("should not overwrite if another field is not referenced", () => {
		// getPubValues returns an empty dictionary if we only have text (no pubfields, pubs, etc.)
		vi.mocked(getPubValues).mockReturnValue({});

		const values = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String, value: "original title" },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText, value: "stub" },
		];
		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual([
			{
				slug: "croccroc:title",
				value: "original title",
			},
			{ slug: "croccroc:richtext", value: "stub" },
		]);
	});

	it("should overwrite string pubfields", () => {
		// Adding a Title field
		vi.mocked(getPubValues).mockReturnValue({
			[pubId]: {
				pubId: pubId,
				parentPubId: "",
				pubTypeId: "6a944264-3c0a-47e1-8589-c5bed4448f35",
				values: {
					"croccroc:title": [
						{
							type: "paragraph",
							attrs: {
								id: null,
								class: null,
							},
							content: [
								{
									type: "text",
									text: "new title",
								},
							],
						},
					],
				},
			},
		});
		const values = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String, value: "old title" },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText, value: "stub" },
		];
		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual([
			{ slug: "croccroc:title", value: "new title" },
			{
				slug: "croccroc:richtext",
				value: "stub",
			},
		]);
	});

	it("should collapse multipart fields", () => {
		// Adding a Title field with two parts
		vi.mocked(getPubValues).mockReturnValue({
			[pubId]: {
				pubId: pubId,
				parentPubId: "",
				pubTypeId: "6a944264-3c0a-47e1-8589-c5bed4448f35",
				values: {
					"croccroc:title": [
						{
							type: "paragraph",
							attrs: {
								id: null,
								class: null,
							},
							content: [
								{
									type: "text",
									text: "new title",
								},
							],
						},
						{
							type: "paragraph",
							attrs: {
								id: null,
								class: null,
							},
							content: [
								{
									type: "text",
									text: "second part",
								},
							],
						},
					],
				},
			},
		});
		const values = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String, value: "old title" },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText, value: "stub" },
		];
		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual([
			{ slug: "croccroc:title", value: "new title, second part" },
			{
				slug: "croccroc:richtext",
				value: "stub",
			},
		]);
	});

	it("returns children pub", () => {
		// Adding a pub of type Submission
		vi.mocked(getPubValues).mockReturnValue({
			"4066997a-3059-4d97-9a3a-8e1f93842a30": {
				pubId: "4066997a-3059-4d97-9a3a-8e1f93842a30",
				parentPubId: "",
				pubTypeId: "800b2e16-f22b-4930-a639-151d24ccaa1e",
				values: {
					"croccroc:title": "",
					"croccroc:content": "",
					"croccroc:email": "",
					"croccroc:url": "",
					"croccroc:memberid": "",
					"croccroc:ok": "",
					"croccroc:file": "",
					"croccroc:confidence": "",
				},
			},
		});
		const values = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String, value: "old title" },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText, value: "stub" },
		];
		const { values: result, relatedPubs } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		// No change to pub fields
		expect(result).toEqual([
			{ slug: "croccroc:title", value: "old title" },
			{ slug: "croccroc:richtext", value: "stub" },
		]);
		// But there should be related pubs
		expect(relatedPubs).toEqual([
			{
				id: "4066997a-3059-4d97-9a3a-8e1f93842a30",
				pubTypeId: "800b2e16-f22b-4930-a639-151d24ccaa1e",
				values: {
					"croccroc:title": "",
					"croccroc:content": "",
					"croccroc:email": "",
					"croccroc:url": "",
					"croccroc:memberid": "",
					"croccroc:ok": "",
					"croccroc:file": "",
					"croccroc:confidence": "",
				},
			},
		]);
	});
});
