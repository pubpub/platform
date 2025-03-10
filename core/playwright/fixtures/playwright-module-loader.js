console.log("we have loaded");

const resolvedDestination = {
	url: new URL("./stubs.js", import.meta.url).href,
	shortCircuit: true,
};

export async function resolve(specifier, context, nextResolve) {
	// Mock specific modules
	if (
		specifier === "server-only" ||
		specifier === "react" ||
		specifier === "next/headers" ||
		specifier === "next/cache" ||
		specifier === "next/server" ||
		specifier === "next/navigation" ||
		/@nimpl/.test(specifier) ||
		/cache\/auto/.test(specifier)
	) {
		return resolvedDestination;
	}

	if (/kysely\/database.ts/.test(specifier)) {
		const newUrl = new URL("../../lib/__tests__/db.ts", import.meta.url).href;
		console.log(newUrl);
		return {
			url: newUrl,
			shortCircuit: true,
		};
	}

	// Use the default resolver for all other modules
	return nextResolve(specifier);
}

export default async () => {
	console.log("playwright-module-loader");
	return;
};
