/* eslint-disable no-console */

import { hash } from "@node-rs/argon2";

import { db } from "./kysely";

export const createPasswordHash = async (password: string) => {
	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	return passwordHash;
};

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
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;
	const adminFirstName = process.env.ADMIN_FIRSTNAME;
	const adminLastName = process.env.ADMIN_LASTNAME;

	if (!adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
		throw new Error(
			"ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRSTNAME, and ADMIN_LASTNAME must be set for admin initialization"
		);
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
		console.log(`${adminEmail}`);
	} catch (e) {
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
