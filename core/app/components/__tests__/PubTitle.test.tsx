import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { PubTitle } from "../PubTitle"

test("PubTitle component includes the pub title", async () => {
	const currentDate = new Date()

	const pub = {
		id: "b5702ef8-29b9-43ad-866c-4c337f598d88",
		valuesBlob: null,
		pubTypeId: "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225",
		communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
		createdAt: currentDate,
		updatedAt: currentDate,
		title: null as string | null,
		pubType: {
			id: "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225",
			name: "Submission",
			description: null,
			communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
			createdAt: currentDate,
			updatedAt: currentDate,
		},
		values: [
			{
				id: "7d5bf8fb-bd26-4cf0-9d52-793e260eaffb",
				fieldId: "e1cf1a7c-88ed-4a9d-8c76-6248ac636a87",
				value: "Why Cyclamates were Banned",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: currentDate,
				updatedAt: currentDate,
				relatedPubId: null,
				field: {
					id: "e1cf1a7c-88ed-4a9d-8c76-6248ac636a87",
					name: "Title",
					slug: "unjournal:title",
					createdAt: currentDate,
					updatedAt: currentDate,
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "String",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
					isRelation: false,
				},
				lastModifiedBy: "unknown",
			},
			{
				id: "d2912025-8d4f-40b1-9bc4-7cbecdf498ba",
				fieldId: "0e4deea4-4866-493d-a408-657b97549dd9",
				value: "10.1016/s0140-6736(70)92760-1",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: currentDate,
				updatedAt: currentDate,
				relatedPubId: null,
				lastModifiedBy: "unknown",
				field: {
					id: "0e4deea4-4866-493d-a408-657b97549dd9",
					name: "DOI",
					slug: "unjournal:doi",
					createdAt: currentDate,
					updatedAt: currentDate,
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "String",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
					isRelation: false,
				},
			},
			{
				id: "129dc290-bd3f-4251-9a91-e9c8172589ae",
				fieldId: "6ad9a55e-8451-448f-9961-2f0887dda882",
				value: "https://linkinghub.elsevier.com/retrieve/pii/S0140673670927601",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: currentDate,
				updatedAt: currentDate,
				relatedPubId: null,
				lastModifiedBy: "unknown",
				field: {
					id: "6ad9a55e-8451-448f-9961-2f0887dda882",
					name: "URL",
					slug: "unjournal:url",
					createdAt: currentDate,
					updatedAt: currentDate,
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "URL",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
					isRelation: false,
				},
			},
		],
		stages: [
			{
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				stageId: "d373e08f-d309-4f84-aa17-cce30ac95a0f",
				stage: {
					id: "d373e08f-d309-4f84-aa17-cce30ac95a0f",
					name: "Submitted",
					order: "aa",
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
					createdAt: currentDate,
					updatedAt: currentDate,
				},
			},
		],
		members: [],
	}

	render(<PubTitle pub={pub} />)
	expect(screen.getByText(`Why Cyclamates were Banned`)).toBeDefined()

	pub.title = `Why Cyclamates were not Banned`
	render(<PubTitle pub={pub} />)
	expect(screen.getByText(`Why Cyclamates were not Banned`)).toBeDefined()

	pub.title = null
	pub.values = []

	render(<PubTitle pub={pub} />)
	expect(screen.getByText(`Untitled Submission - ${currentDate.toDateString()}`)).toBeDefined()
})
