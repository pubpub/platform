import { getEnvVar } from "./env";

const clientVars = [
	"NEXT_PUBLIC_PUBPUB_URL",
	"NEXT_PUBLIC_SUPABASE_PUBLIC_KEY",
	"NEXT_PUBLIC_SUPABASE_URL",
] as const;

type ClientEnv = Record<(typeof clientVars)[number], string>;

export const clientEnv: ClientEnv = Object.fromEntries([
	clientVars.map((varName) => [varName, getEnvVar(varName)]),
]);
