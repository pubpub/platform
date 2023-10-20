import { parse } from "csv-parse";
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { formatSupabaseError } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const getServerSupabase = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error("Missing Supabase parameters");
	}
	return createClient(url, key, {
		auth: {
			persistSession: false,
		},
	});
};
const client = getServerSupabase();

const inviteUser = async (email, firstName, lastName) => {
	const { error: createError } = await client.auth.admin.createUser({email,
		password: randomUUID(),
		user_metadata: {
			firstName,
			lastName,
		},
		email_confirm: true,
	});
	if (createError) {
		throw new Error(formatSupabaseError(createError));
	}

	const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_PUBPUB_URL}/reset`
	})
	if (resetError) {
		throw new Error(formatSupabaseError(resetError));
	}
};

const inviteUsersFromCsv = async (path) => {
	const parser = fs.createReadStream(path).pipe(parse({ columns: true }));
	for await (const row of parser) {
		if (!row.firstName || !row.email) {
			console.log("Unable to invite user without firstname or email: ", row);
			continue;
		}
		try {
			await inviteUser(row.email, row.firstName, row.lastName);
		} catch (err) {
			console.log(err);
			console.log(`Failed to invite ${row.firstName} ${row.lastName} ${row.email}`);
			continue;
		}
		console.log(`Invited ${row.firstName} ${row.lastName} ${row.email}`);
	}
};

const usage = () => {
	console.log("Usage:\npnpm --filter core invite-users <path-to-csv>");
	process.exit();
};

const { _: args} = yargs(hideBin(process.argv)).argv;
if (args.length !== 1) {
	console.log(args);
	usage();
}

inviteUsersFromCsv(args[0]);
