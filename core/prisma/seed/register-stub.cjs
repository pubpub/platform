const Module = require("module");
const path = require("path");

// Keep original resolvers
const originalResolveFilename = Module._resolveFilename;

// Add module resolution interception
Module._resolveFilename = function (request, parent, isMain, options) {
	if (
		request === "react" ||
		/react$/.test(request) ||
		/cache\/auto.*/.test(request) ||
		request === "server-only" ||
		/\/loginData/.test(request) ||
		/react-email/.test(request)
	) {
		return path.resolve(__dirname, "stubs.cjs");
	}

	return originalResolveFilename.apply(this, arguments);
};
