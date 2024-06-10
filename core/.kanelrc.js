// @ts-check
const { makeKyselyHook } = require("kanel-kysely");
const {
	generateZodSchemas,
	makeGenerateZodSchemas,
	defaultZodTypeMap,
	defaultGetZodSchemaMetadata,
	defaultGetZodIdentifierMetadata,
} = require("kanel-zod");
const {
	kanelKyselyZodCompatibilityHook,
	kanelKyselyZodCompatibilityPreRenderHook,
} = require("./prisma/kanel-kysely-zod-compatibility-hook.cjs");

/** @type {import('kanel').Config} */
module.exports = {
	connection: process.env["DATABASE_URL"],
	schemas: ["public"],

	preDeleteOutputFolder: true,
	preRenderHooks: [
		makeKyselyHook(),
		// makeGenerateZodSchemas({
		// 	castToSchema: true,
		// 	zodTypeMap: defaultZodTypeMap,
		// 	getZodSchemaMetadata: (d, generateFor, instantiatedConfig) => {
		// 		return defaultGetZodSchemaMetadata(d, generateFor, instantiatedConfig);
		// 	},
		// 	getZodIdentifierMetadata: defaultGetZodIdentifierMetadata,
		// }),
		// kanelKyselyZodCompatibilityPreRenderHook,
	],
	// postRenderHooks: [kanelKyselyZodCompatibilityHook],
	outputPath: "../packages/db/src",

	customTypeMap: {
		"pg_catalog.tsvector": "string",
		"pg_catalog.bpchar": "string",
	},
};
