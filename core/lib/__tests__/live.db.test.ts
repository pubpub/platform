import type { ClientException } from "../serverActions"

import { describe, expect, test } from "vitest"

import { CoreSchemaType, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { isClientException } from "../serverActions"
import { mockServerCode } from "./utils"

const { testDb, getLoginData, createForEachMockedTransaction } = await mockServerCode()

const { getTrx, rollback, commit } = createForEachMockedTransaction()

const communitySeed = createSeed({
	community: {
		name: "test",
		slug: "test",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
		},
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "test",
			},
		},
	],
})

const seed = async (trx = testDb) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
	return seedCommunity(communitySeed, undefined, trx)
}

describe("live", () => {
	test("should be able to connect to db", async () => {
		const result = await testDb.selectFrom("users").selectAll().execute()
		expect(result.length).toBeGreaterThan(0)
	})

	test("can rollback transactions", async () => {
		const trx = getTrx()

		const { community, users, pubs } = await seed(trx)

		// Insert a user
		const user = await trx
			.insertInto("users")
			.values({
				email: "test@email.com",
				slug: "test-user",
				firstName: "test",
				lastName: "user",
			})
			.returning(["id"])
			.executeTakeFirstOrThrow()

		const selectUser = await trx
			.selectFrom("users")
			.select("firstName")
			.where("id", "=", user.id)
			.executeTakeFirstOrThrow()

		// Make sure we can select the "created" user
		expect(selectUser.firstName).toEqual("test")

		rollback()

		// Make sure user did not persist
		const selectUserAgain = await testDb
			.selectFrom("users")
			.select("firstName")
			.where("id", "=", user.id)
			.execute()

		expect(selectUserAgain.length).toEqual(0)
	})

	// Just an example: the test will add a user, but the afterEach will rollback
	// Not sure how to assert since tests may not run serially, but can look at
	// db to see that no user 'test-user' has been added. This is another version
	// of the "can rollback transactions" test above
	// The benefit of this method is that you don't have to remember to rollback yourself
	describe("transaction block example", () => {
		test("can add a user that will not persist", async () => {
			const trx = getTrx()

			await trx
				.insertInto("users")
				.values({
					email: "test@email.com",
					slug: "test-user",
					firstName: "test",
					lastName: "user",
				})
				.returning(["id"])
				.executeTakeFirstOrThrow()
		})

		test("user did not persist", async () => {
			const trx = getTrx()
			const user = await trx.selectFrom("users").where("slug", "=", "test-user").execute()
			expect(user.length).toEqual(0)
		})
	})

	test("createForm needs a logged in user", async () => {
		const trx = getTrx()

		const { community, users, pubs } = await seed(trx)

		getLoginData.mockImplementation(() => {
			return { user: null }
		})

		const createForm = await import("~/app/c/[communitySlug]/forms/actions").then(
			(m) => m.createForm
		)

		const pubType = await trx
			.selectFrom("pub_types")
			.select(["id"])
			.where("communityId", "=", community.id)
			.executeTakeFirstOrThrow()

		const result = await createForm(pubType.id, "my form", "my-form-1", community.id)
		expect(isClientException(result)).toBeTruthy()
		expect((result as ClientException).error).toEqual("Not logged in")
	})

	test("getForm and createForm", async () => {
		const trx = getTrx()
		getLoginData.mockImplementation(() => {
			return { user: { id: "123", isSuperAdmin: true } }
		})

		const { community, users, pubs } = await seed(trx)
		const getForm = await import("../server/form").then((m) => m.getForm)
		const createForm = await import("~/app/c/[communitySlug]/forms/actions").then(
			(m) => m.createForm
		)

		const forms = await getForm({ slug: "my-form-2", communityId: community.id }).execute()
		expect(forms.length).toEqual(0)

		const pubType = await trx
			.selectFrom("pub_types")
			.select(["id"])
			.where("communityId", "=", community.id)
			.executeTakeFirstOrThrow()

		await createForm(pubType.id, "my form", "my-form-2", community.id)

		const form = await getForm({
			slug: "my-form-2",
			communityId: community.id,
		}).executeTakeFirstOrThrow()

		expect(form.name).toEqual("my form")
	})
})
