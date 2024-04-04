import { randomUUID } from "crypto";
import fs from "fs";

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { logger } from "logger";

import { env } from "../lib/env/env.mjs";
import { formatSupabaseError } from "../lib/supabase";
import { unJournalId } from "../prisma/exampleCommunitySeeds/unjournal";

const getServerSupabase = () => {
	const url = env.NEXT_PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;

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
	const { error } = await client.auth.signUp({
		email,
		password: randomUUID(),
		options: {
			emailRedirectTo: `${env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
			data: {
				firstName,
				lastName,
				communityId: unJournalId,
				canAdmin: true,
			},
		},
	});
	if (error) {
		throw new Error(formatSupabaseError(error));
	}
};

const inviteUsersFromCsv = async (path) => {
	const parser = fs.createReadStream(path).pipe(parse({ columns: true }));
	for await (const row of parser) {
		if (!row.firstName || !row.email) {
			logger.error(`Unable to invite user without firstname or email: ${row}`);
			continue;
		}
		try {
			await inviteUser(row.email, row.firstName, row.lastName);
		} catch (err) {
			logger.error(err);
			logger.error(`Failed to invite ${row.firstName} ${row.lastName} ${row.email}`);
			continue;
		}
		logger.error(`Invited ${row.firstName} ${row.lastName} ${row.email}`);
	}
};

const usage = () => {
	logger.info("Usage:\npnpm --filter core invite-users <path-to-csv>");
	process.exit();
};

const { _: args } = yargs(hideBin(process.argv)).argv;
if (args.length !== 1) {
	logger.debug(args);
	usage();
}

inviteUsersFromCsv(args[0]);
