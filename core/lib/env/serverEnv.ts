import { getEnvVar } from "./env";

const serverVars = [
	"SUPABASE_WEBHOOKS_API_KEY",
	"API_KEY",
	"ASSETS_BUCKET_NAME",
	"ASSETS_REGION",
	"ASSETS_UPLOAD_KEY",
	"ASSETS_UPLOAD_SECRET_KEY",
	"DATABASE_URL",
	"JWT_SECRET",
	"MAILGUN_SMTP_PASSWORD",
	"MAILGUN_SMTP_USERNAME",
	"NODE_ENV",
	"SUPABASE_SERVICE_ROLE_KEY",
	"SUPABASE_WEBHOOKS_API_KEY",
	"MAILGUN_SMTP_HOST",
	"MAILGUN_SMTP_PORT",
] as const;

type ServerEnv = Record<(typeof serverVars)[number], string>;

export const serverEnv: ServerEnv = Object.fromEntries([
	serverVars.map((varName) => [varName, getEnvVar(varName)]),
]);
