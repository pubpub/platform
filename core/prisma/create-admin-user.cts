/* eslint-disable no-console */

import { createEnv } from "@t3-oss/env-nextjs";
import { Kysely, PostgresDialect } from "kysely";
import * as pg from "pg";
import { z } from "zod";

import { Database } from "db/Database";

import { isUniqueConstraintError } from "../kysely/errors";
import { createPasswordHash } from "../lib/authentication/password";

const env = createEnv({
	server: {
		ADMIN_EMAIL: z.string().email(),
		ADMIN_PASSWORD: z.string().min(8),
		ADMIN_FIRSTNAME: z.string(),
		ADMIN_LASTNAME: z.string(),
		DATABASE_URL: z.string(),
	},
	client: {},
	experimental__runtimeEnv: {},
});

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: env.DATABASE_URL,
	}),
});

const db = new Kysely<Database>({
	dialect,
});

async function createAdminUser({
	email,
	password,
	firstName,
	lastName,
}: {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}) {
	const values = {
		slug: email.split("@")[0],
		email,
		firstName,
		lastName,
		passwordHash: await createPasswordHash(password),
		isSuperAdmin: true,
	};

	return db.insertInto("users").values(values).returningAll().executeTakeFirstOrThrow();
}

async function main() {
	const adminEmail = env.ADMIN_EMAIL;
	const adminPassword = env.ADMIN_PASSWORD;
	const adminFirstName = env.ADMIN_FIRSTNAME;
	const adminLastName = env.ADMIN_LASTNAME;

	if (!adminEmail || !adminPassword) {
		throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set for admin initialization");
	}

	try {
		await createAdminUser({
			email: adminEmail,
			password: adminPassword,
			firstName: adminFirstName,
			lastName: adminLastName,
		});
		console.log("✨ Admin user created successfully!");
		console.log(`You can now log in with:`);
		console.log(`Email: ${adminEmail}`);
		console.log(`Password: ${adminPassword}`);
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			console.log("⚠️ Admin user already exists, skipping initialization");
			return;
		}
		throw e;
	}
}

if (require.main === module) {
	main()
		.then(() => process.exit(0))
		.catch((e) => {
			console.error(e);
			process.exit(1);
		});
}
