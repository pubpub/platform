// Custom module loader for Playwright tests
const originalLoader = require("module")._load;

// Override the module loader
require("module")._load = function (request, parent, isMain) {
	console.log(request);
	// Mock specific modules
	if (request === "server-only") {
		return {};
	}
	if (request === "react") {
		return {
			cache: (fn) => fn,
			forwardRef: (fn) => fn,
		};
	}
	if (request === "next/headers") {
		return {
			cookies: () => {},
			headers: () => {},
		};
	}
	if (request === "next/cache") {
		return {
			unstable_cache: (fn) => fn,
		};
	}
	if (request === "next/server") {
		return {};
	}
	if (/cache\/auto*/.test(request)) {
		return {
			autoRevalidate: (fn) => fn,
			autoCache: (fn) => fn,
		};
	}

	// Use the original loader for all other modules
	return originalLoader(request, parent, isMain);
};
console.log("hhh");

const Module = require("module");
const path = require("path");
const originalResolveFilename = Module._resolveFilename;

// Add module resolution interception
Module._resolveFilename = function (request, parent, isMain, options) {
	console.log("resolving");
	console.log(request);
	console.log(parent);
	console.log(isMain);
	if (
		request === "react" ||
		/react$/.test(request) ||
		/cache\/auto.*/.test(request) ||
		request === "server-only" ||
		/\/loginData/.test(request) ||
		/react-email/.test(request)
	) {
		console.log("hihih");
		return path.resolve(__dirname, "..", "..", "prisma", "seed", "stubs.cjs");
	}

	return originalResolveFilename.apply(this, arguments);
};

module.exports = async () => {
	console.log("playwright-module-loader");
	return;
};
