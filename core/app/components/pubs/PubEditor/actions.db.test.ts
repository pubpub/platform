import { describe, expect, it } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";

import type { ClientException } from "~/lib/serverActions";
import { mockServerCode } from "~/lib/__tests__/utils";
import { isClientException } from "~/lib/serverActions";

const { createForEachMockedTransaction, getLoginData } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("createPubRecursive", () => {
	it("Needs a logged in user", async () => {
		const trx = getTrx();
		getLoginData.mockImplementation(() => {
			return undefined;
		});
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-server-pub",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Minimal Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {},
			},
			pubs: [
				{
					pubType: "Minimal Pub",
					values: {
						Title: "Some title",
					},
					stage: "Stage 1",
				},
			],
			users: {},
		});

		const { createPubRecursive } = await import("./actions");

		const result = await createPubRecursive({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Minimal Pub"].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
			},
			trx,
		});

		expect(isClientException(result)).toBeTruthy();
		expect((result as ClientException).error).toEqual("Not logged in");
	});

	it("Needs an authorized user", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes, users } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-server-pub",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Minimal Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {},
			},
			pubs: [
				{
					pubType: "Minimal Pub",
					values: {
						Title: "Some title",
					},
					stage: "Stage 1",
				},
			],
			users: {
				john: {
					firstName: "John",
					role: MemberRole.contributor,
					password: "john-password",
					email: "john@example.com",
				},
			},
		});
		getLoginData.mockImplementation(() => {
			return { user: { id: users.john.id } };
		});

		const { createPubRecursive } = await import("./actions");

		const result = await createPubRecursive({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Minimal Pub"].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
			},
			trx,
		});

		expect(isClientException(result)).toBeTruthy();
		expect((result as ClientException).error).toEqual(
			"You are not authorized to perform this action"
		);
	});

	it("Can create if all permissions are satisfied", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes, users } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-server-pub",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Minimal Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {},
			},
			pubs: [
				{
					pubType: "Minimal Pub",
					values: {
						Title: "Some title",
					},
					stage: "Stage 1",
				},
			],
			users: {
				john: {
					firstName: "John",
					role: MemberRole.admin,
					password: "john-password",
					email: "john@example.com",
				},
			},
		});
		getLoginData.mockImplementation(() => {
			return { user: { id: users.john.id } };
		});

		const { createPubRecursive } = await import("./actions");

		const result = await createPubRecursive({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Minimal Pub"].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
			},
			trx,
		});

		expect(result).toMatchObject({
			report: "Successfully created a new Pub",
			success: true,
		});
	});
});
