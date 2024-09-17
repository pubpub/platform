import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { PubPayload } from "~/lib/server/_legacy-integration-queries";
import { PubTitle } from "../PubTitle";

test("PubTitle component includes the pub title", async () => {
	const pub: PubPayload = {
		id: "b5702ef8-29b9-43ad-866c-4c337f598d88",
		assigneeId: null,
		valuesBlob: null,
		pubTypeId: "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225",
		communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
		createdAt: new Date(),
		updatedAt: new Date(),
		parentId: "6234d4ed-e87e-41ab-9b5b-68bf9fb9a61c",
		pubType: {
			id: "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225",
			name: "Submission",
			description: null,
			communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		values: [
			{
				id: "7d5bf8fb-bd26-4cf0-9d52-793e260eaffb",
				fieldId: "e1cf1a7c-88ed-4a9d-8c76-6248ac636a87",
				value: "Why Cyclamates were Banned",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: new Date(),
				updatedAt: new Date(),
				field: {
					id: "e1cf1a7c-88ed-4a9d-8c76-6248ac636a87",
					name: "Title",
					slug: "unjournal:title",
					integrationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "String",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
				},
			},
			{
				id: "d2912025-8d4f-40b1-9bc4-7cbecdf498ba",
				fieldId: "0e4deea4-4866-493d-a408-657b97549dd9",
				value: "10.1016/s0140-6736(70)92760-1",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: new Date(),
				updatedAt: new Date(),
				field: {
					id: "0e4deea4-4866-493d-a408-657b97549dd9",
					name: "DOI",
					slug: "unjournal:doi",
					integrationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "String",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
				},
			},
			{
				id: "129dc290-bd3f-4251-9a91-e9c8172589ae",
				fieldId: "6ad9a55e-8451-448f-9961-2f0887dda882",
				value: "https://linkinghub.elsevier.com/retrieve/pii/S0140673670927601",
				pubId: "b5702ef8-29b9-43ad-866c-4c337f598d88",
				createdAt: new Date(),
				updatedAt: new Date(),
				field: {
					id: "6ad9a55e-8451-448f-9961-2f0887dda882",
					name: "URL",
					slug: "unjournal:url",
					integrationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					pubFieldSchemaId: null,
					schema: null,
					schemaName: "URL",
					isArchived: false,
					communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
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
					createdAt: new Date(),
					updatedAt: new Date(),
					integrationInstances: [
						{
							id: "af837db6-9a1f-4b38-878f-f84fde8a0b50",
							name: "Unjournal Submissions Manager",
							integrationId: "6f4334b8-f31c-417f-8db1-c4dfa671c30b",
							communityId: "03e7a5fd-bdca-4682-9221-3a69992c1f3b",
							createdAt: new Date(),
							updatedAt: new Date(),
							stageId: "d373e08f-d309-4f84-aa17-cce30ac95a0f",
							config: { pubTypeId: "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225" },
							integration: {
								id: "6f4334b8-f31c-417f-8db1-c4dfa671c30b",
								name: "Submission Manager",
								actions: [
									{
										href: "http://localhost:3002/actions/submit",
										kind: "stage",
										name: "submit",
										text: "Submit Pub",
									},
								],
								settingsUrl: "http://localhost:3002/configure",
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						},
					],
				},
			},
		],
		integrationInstances: [],
		claims: [],
		children: [],
		permissions: [],
	};

	render(<PubTitle pub={pub} />);
	expect(screen.getByText("Why Cyclamates were Banned")).toBeDefined();
});
