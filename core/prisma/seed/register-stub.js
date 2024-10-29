const Module = require("module");
const path = require("path");

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
	if (request === "react" || /cache\/auto.*/.test(request) || request === "server-only") {
		return path.resolve(__dirname, "stubs.js");
	}

	return originalResolveFilename(request, parent, isMain, options);
};
