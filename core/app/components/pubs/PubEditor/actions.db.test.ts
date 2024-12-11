import { describe, expect, test } from "vitest";

import type { UsersId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction, getLoginData, findCommunityBySlug } =
	await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("createPubRecursive", () => {
	test.each([
		{
			name: "Needs a logged in user",
			loginUser: undefined,
			userRole: MemberRole.admin,
			expected: { error: "Not logged in" },
		},
		{
			name: "Needs an authorized user",
			loginUser: { id: crypto.randomUUID() as UsersId },
			userRole: MemberRole.contributor,
			expected: { error: "You are not authorized to perform this action" },
		},
		{
			name: "Can create if all permissions are satisfied",
			loginUser: { id: crypto.randomUUID() as UsersId },
			userRole: MemberRole.admin,
			expected: {
				report: "Successfully created a new Pub",
				success: true,
			},
		},
	])("$name", async ({ loginUser, userRole, expected }) => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes, users } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-actions-create-pub",
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
					id: loginUser ? loginUser.id : undefined,
					firstName: "John",
					role: userRole,
					password: "john-password",
					email: "john@example.com",
				},
			},
		});
		getLoginData.mockImplementation(() => {
			return { user: loginUser ? { id: users.john.id } : undefined };
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
		expect(result).toMatchObject(expected);
	});
});

describe("updatePub", () => {
	test.each([
		{
			name: "Needs a logged in user",
			loginUser: undefined,
			userRole: MemberRole.admin,
			expected: { error: "Not logged in" },
		},
		{
			name: "Needs an authorized user",
			loginUser: { id: crypto.randomUUID() as UsersId },
			userRole: MemberRole.contributor,
			expected: { error: "You are not authorized to perform this action" },
		},
		{
			name: "Can update if all permissions are satisfied",
			loginUser: { id: crypto.randomUUID() as UsersId },
			userRole: MemberRole.admin,
			expected: [
				{
					value: "new title",
				},
			],
		},
	])("$name", async ({ loginUser, userRole, expected }) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubs, users } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-actions-create-pub",
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
					id: loginUser ? loginUser.id : undefined,
					firstName: "John",
					role: userRole,
					password: "john-password",
					email: "john@example.com",
				},
			},
		});
		getLoginData.mockImplementation(() => {
			return { user: loginUser ? { id: users.john.id } : undefined };
		});
		findCommunityBySlug.mockImplementation(() => {
			return community;
		});

		const { updatePub } = await import("./actions");

		const result = await updatePub({
			pubId: pubs[0].id,
			pubValues: {
				[`${community.slug}:title`]: "new title",
			},
			continueOnValidationError: false,
		});
		expect(result).toMatchObject(expected);
	});
});
