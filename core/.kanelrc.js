// @ts-check
const { makeKyselyHook } = require("kanel-kysely");
const {
	generateZodSchemas,
	makeGenerateZodSchemas,
	defaultGetZodIdentifierMetadata,
	defaultGetZodSchemaMetadata,
} = require("kanel-zod");
const {
	kanelKyselyZodCompatibilityPreRenderHook,
} = require("./prisma/kanel-kysely-zod-compatibility-hook.cjs");

/** @type {import('kanel').Config} */
module.exports = {
	connection: process.env["DATABASE_URL"],
	schemas: ["public"],

	/**
	 * otherwise e.g. the `packages/db/src/types` folder will be deleted before the build
	 */
	preDeleteOutputFolder: false,
	enumStyle: "enum",
	preRenderHooks: [
		makeKyselyHook(),
		generateZodSchemas,
		kanelKyselyZodCompatibilityPreRenderHook,
	],
	outputPath: "../packages/db/src",

	customTypeMap: {
		"pg_catalog.tsvector": "string",
		"pg_catalog.bpchar": "string",
	},
};
