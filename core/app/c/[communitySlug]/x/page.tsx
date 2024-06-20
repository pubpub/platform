import { faker } from "@faker-js/faker";

import { Button } from "ui/button";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";

export default async function Page({ params: { communitySlug } }) {
	const users2 = await autoCache(
		db
			.selectFrom("users")
			.select((eb) => ["id", "firstName", "lastName", "email", "avatar", "createdAt"])
			.limit(4)
			.orderBy("createdAt", "desc"),

		{
			log: ["verbose", "datacache", "dedupe"],
		}
	).execute();

	return (
		<>
			<h1>Dashboard</h1>
			<form
				action={async () => {
					"use server";
					return autoRevalidate(
						db
							.insertInto("users")
							.values({
								firstName: faker.person.firstName(),
								lastName: faker.person.lastName(),
								email: faker.internet.email(),
								avatar: faker.image.avatar(),
								slug: `test-${Math.random()}`,
							})
							.returningAll()
					).execute();
				}}
			>
				<Button type="submit">Add new user</Button>
			</form>
			{users2.map((user) => (
				<div key={user.id}>
					<p>
						{user.firstName} {user.lastName}
					</p>
					<p>{user.id}</p>
				</div>
			))}
		</>
	);
}
