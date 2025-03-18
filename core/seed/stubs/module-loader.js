// @ts-check

const resolvedDestination = {
	url: new URL("./stubs.js", import.meta.url).href,
	shortCircuit: true,
};

/**
 * @type {import("node:module").ResolveHook}
 */
export async function resolve(specifier, context, nextResolve) {
	if (
		specifier === "server-only" ||
		specifier === "react" ||
		specifier === "next/headers" ||
		specifier === "next/cache" ||
		specifier === "next/server" ||
		specifier === "next/navigation" ||
		specifier === "@sentry/nextjs" ||
		/@nimpl/.test(specifier) ||
		/cache\/auto/.test(specifier)
	) {
		return resolvedDestination;
	}

	// if (/kysely\/database.ts/.test(specifier)) {
	// 	const newUrl = new URL("../../../lib/__tests__/db.ts", import.meta.url).href;
	// 	return {
	// 		url: newUrl,
	// 		shortCircuit: true,
	// 	};
	// }

	// Use the default resolver for all other modules
	return nextResolve(specifier, context);
}

export default async () => {
	return;
};
