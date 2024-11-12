import { getPubValues } from "context-editor";
import { describe, expect, it, test, vi } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { parseRichTextForPubFieldsAndRelatedPubs } from "../fields/richText";

vi.mock("context-editor", () => ({
	getPubValues: vi.fn(),
}));

describe("parseRichTextForPubFieldsAndRelatedPubs", () => {
	const pubId = crypto.randomUUID() as PubsId;
	it("should do nothing if there is no rich text field", () => {
		const elements = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String },
			{ slug: "croccroc:content", schemaName: CoreSchemaType.String },
		];
		const newValues = { "croccroc:title": "my title", "croccroc:content": "my content" };
		const { values } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			elements,
			newValues,
		});
		expect(values).toEqual(newValues);
	});

	it("should not overwrite if another field is not referenced", () => {
		// getPubValues returns an empty dictionary if we only have text (no pubfields, pubs, etc.)
		vi.mocked(getPubValues).mockReturnValue({});

		const elements = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText },
		];
		const { values } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			elements,
			newValues: {
				"croccroc:title": "original title",
				"croccroc:richtext": "todo",
			},
		});
		expect(values).toEqual({
			"croccroc:title": "original title",
			"croccroc:richtext": "todo",
		});
	});

	it("should overwrite pubfields", () => {
		// Adding a Title field
		vi.mocked(getPubValues).mockReturnValue({
			"": {
				pubId: "",
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
		const elements = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText },
		];
		const { values } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			elements,
			newValues: {
				"croccroc:richtext": "todo",
			},
		});
		expect(values).toEqual({
			"croccroc:richtext": "todo",
			"croccroc:title": "new title",
		});
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
		const elements = [
			{ slug: "croccroc:title", schemaName: CoreSchemaType.String },
			{ slug: "croccroc:richtext", schemaName: CoreSchemaType.RichText },
		];
		const newValues = { "croccroc:richtext": "todo" };
		const { values, relatedPubs } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			elements,
			newValues,
		});
		// No change to pub fields
		expect(values).toEqual(newValues);
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
