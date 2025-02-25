import { describe, expect, it } from "vitest";

import type { PubsId } from "db/public";

import { parseRichTextForPubFieldsAndRelatedPubs } from "../fields/richText";

describe("parseRichTextForPubFieldsAndRelatedPubs", () => {
	const pubId = crypto.randomUUID() as PubsId;
	it("should do nothing if there is no rich text field", () => {
		const values = {
			"croccroc:title": "my title",
			"croccroc:content": "my content",
		};

		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual({
			"croccroc:title": "my title",
			"croccroc:content": "my content",
		});
	});

	it("should not overwrite if another field is not referenced", () => {
		const richTextValue = {
			type: "doc",
			attrs: {
				meta: {},
			},
			content: [
				{
					type: "paragraph",
					attrs: {
						id: null,
						class: null,
					},
					content: [
						{
							type: "text",
							text: "rich text",
						},
					],
				},
			],
		};

		const values = {
			"croccroc:title": "original title",

			"croccroc:richtext": richTextValue,
		};

		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual({
			"croccroc:title": "original title",
			"croccroc:richtext": richTextValue,
		});
	});

	it("should overwrite string pubfields", () => {
		const richTextValue = {
			type: "doc",
			attrs: {
				meta: {},
			},
			content: [
				{
					type: "contextDoc",
					attrs: {
						id: null,
						class: null,
						pubId,
						pubTypeId: "9d661d47-b671-41a6-97ae-afd6b37f32fb",
						parentPubId: pubId,
						fieldSlug: "croccroc:title",
						data: null,
					},
					content: [
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
			],
		};
		const values = {
			"croccroc:title": "old title",

			"croccroc:richtext": richTextValue,
		};

		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual({
			"croccroc:title": "new title",
			"croccroc:richtext": richTextValue,
		});
	});

	it("should collapse multipart fields", () => {
		// Adding a Title field with two parts
		const richTextValue = {
			type: "doc",
			attrs: {
				meta: {},
			},
			content: [
				{
					type: "contextDoc",
					attrs: {
						id: null,
						class: null,
						pubId,
						pubTypeId: "9d661d47-b671-41a6-97ae-afd6b37f32fb",
						parentPubId: pubId,
						fieldSlug: "croccroc:title",
						data: null,
					},
					content: [
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
			],
		};
		const values = { "croccroc:title": "old title", "croccroc:richtext": richTextValue };

		const { values: result } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		expect(result).toEqual({
			"croccroc:title": "new title, second part",
			"croccroc:richtext": richTextValue,
		});
	});

	it("returns related pub", () => {
		// Adding a pub of type Submission
		const richTextValue = {
			type: "doc",
			attrs: {
				meta: {},
			},
			content: [
				{
					type: "contextAtom",
					attrs: {
						id: null,
						class: null,
						pubId: "974d0c6a-6e71-4021-b92b-333417ad9a54",
						pubTypeId: "0cd60de6-6c79-49d3-b08d-61d3ecce19ab",
						parentPubId: "c351d99b-ed13-4052-8652-9b663a976d2c",
						fieldSlug: "",
						data: {
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
				},
			],
		};
		const values = {
			"croccroc:title": "old title",
			"croccroc:richtext": richTextValue,
		};
		const { values: result, relatedPubs } = parseRichTextForPubFieldsAndRelatedPubs({
			pubId,
			values,
		});
		// No change to pub fields
		expect(result).toEqual({
			"croccroc:title": "old title",
			"croccroc:richtext": richTextValue,
		});
		// But there should be related pubs
		expect(relatedPubs).toEqual([
			{
				id: "974d0c6a-6e71-4021-b92b-333417ad9a54",
				pubTypeId: "0cd60de6-6c79-49d3-b08d-61d3ecce19ab",
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
