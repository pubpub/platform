// @ts-check
import type { ZodTypeAny } from "zod";

import { createEnv } from "@t3-oss/env-nextjs";
import { z, ZodError } from "zod";

import { actionSchema } from "db/public";

const selfHostedOptional = (schema: ZodTypeAny) => {
	return process.env.SELF_HOSTED ? schema.optional() : schema;
};

const flagStateToBoolean = (flagState: string, ctx: z.RefinementCtx) => {
	switch (flagState) {
		case "on":
		case "true":
			return true;
		case "off":
		case "false":
			return false;
	}
	ctx.addIssue({
		code: z.ZodIssueCode.custom,
		message: "Invalid flag state",
		fatal: true,
	});
	return z.NEVER;
};

const flagSchema = z.union([
	z.tuple([
		z.literal("disabled-actions"),
		z
			.string()
			.optional()
			.transform((s) => (s ? s.split("+").map((a) => a.trim()) : []))
			.pipe(actionSchema.array()),
	]),
	z.tuple([
		z.literal("invites"),
		z.string().transform(flagStateToBoolean).optional().default("on"),
	]),
	z.tuple([
		z.literal("uploads"),
		z.string().transform(flagStateToBoolean).optional().default("on"),
	]),
]);

type FlagSchema = z.infer<typeof flagSchema>;
type FlagName = FlagSchema[0];
type FlagArgs<F extends FlagName> = Extract<FlagSchema, [F, unknown]>[1];

class Flags {
	#flags;
	constructor(flags: z.infer<typeof flagSchema>[]) {
		this.#flags = new Map(flags as [string, unknown][]);
	}
	get<F extends FlagName>(flagName: F): FlagArgs<F> {
		return (this.#flags.get(flagName) ??
			flagSchema.parse([flagName, undefined])[1]) as FlagArgs<F>;
	}
}

export const env = createEnv({
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
	},
	server: {
		SELF_HOSTED: z.string().optional(),
		API_KEY: z.string(),
		ASSETS_BUCKET_NAME: z.string(),
		ASSETS_REGION: z.string(),
		ASSETS_UPLOAD_KEY: z.string(),
		ASSETS_UPLOAD_SECRET_KEY: z.string(),
		ASSETS_STORAGE_ENDPOINT: z.string().url().optional(),
		/**
		 * Whether or not to verbosely log `memoize` cache hits and misses
		 */
		CACHE_LOG: z.string().optional(),
		DATABASE_URL: z.string().url(),
		KYSELY_DEBUG: z.string().optional(),
		KYSELY_ARTIFICIAL_LATENCY: z.coerce.number().optional(),
		LOG_LEVEL: z.enum(["benchmark", "debug", "info", "warn", "error"]).optional(),
		MAILGUN_SMTP_PASSWORD: selfHostedOptional(z.string()),
		MAILGUN_SMTP_USERNAME: selfHostedOptional(z.string()),
		MAILGUN_SMTP_HOST: selfHostedOptional(z.string()),
		MAILGUN_SMTP_PORT: selfHostedOptional(z.string()),
		MAILGUN_SMTP_FROM: z.string().optional(),
		MAILGUN_SMTP_FROM_NAME: z.string().optional(),
		MAILGUN_INSECURE_SENDMAIL: z.string().optional(),
		MAILGUN_SMTP_SECURITY: z.enum(["ssl", "tls", "none"]).optional(),
		OTEL_SERVICE_NAME: z.string().optional(),
		HONEYCOMB_API_KEY: z.string().optional(),
		PUBPUB_URL: z.string().url(),
		INBUCKET_URL: z.string().url().optional(),
		CI: z.string().or(z.boolean()).optional(),
		GCLOUD_KEY_FILE: selfHostedOptional(z.string()),
		DATACITE_API_URL: z.string().optional(),
		DATACITE_REPOSITORY_ID: z.string().optional(),
		DATACITE_PASSWORD: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string().optional(),
		FLAGS: z
			.string()
			.optional()
			.transform((value) => (value ? value.split(",") : []))
			.transform((flagStrings, ctx) => {
				const parsedFlags: z.infer<typeof flagSchema>[] = [];
				for (const flagString of flagStrings) {
					if (flagString === "") {
						continue;
					}
					try {
						const [flagName, flagArgs] = flagString.split(":");
						const parsedFlag = flagSchema.parse([flagName, flagArgs]);
						parsedFlags.push(parsedFlag);
					} catch (error) {
						if (error instanceof ZodError) {
							error.issues.forEach(ctx.addIssue);
						}
					}
				}
				return new Flags(parsedFlags);
			}),
	},
	client: {},
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
	},
	skipValidation: Boolean(process.env.SKIP_VALIDATION),
	emptyStringAsUndefined: true,
});
