// @ts-check
const { makeKyselyHook } = require("kanel-kysely");

const { generateZodSchemas } = require("kanel-zod");
const {
	kanelKyselyZodCompatibilityPreRenderHook,
} = require("./src/kanel/kanel-kysely-zod-compatibility-hook.cjs");
const {
	kanelDatabaseDefaultExportFixPreRenderHook,
} = require("./src/kanel/kanel-database-default-export-fix-hook.cjs");

console.log("aaa", process.env["DATABASE_URL"]);

/** @type {import('kanel').Config} */
const config = {
	connection: process.env["DATABASE_URL"],
	schemas: ["public"],

	preDeleteOutputFolder: false,
	enumStyle: "enum",
	preRenderHooks: [
		makeKyselyHook(),
		generateZodSchemas,
		kanelKyselyZodCompatibilityPreRenderHook,
		kanelDatabaseDefaultExportFixPreRenderHook,
	],
	outputPath: "./src",

	customTypeMap: {
		"pg_catalog.tsvector": "string",
		"pg_catalog.bpchar": "string",
	},
};

module.exports = config;
