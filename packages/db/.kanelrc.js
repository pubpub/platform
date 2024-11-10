// @ts-check
const { makeKyselyHook } = require("kanel-kysely");
const { generateZodSchemas } = require("kanel-zod");
const {
	kanelKyselyZodCompatibilityPreRenderHook,
} = require("./src/kanel/kanel-kysely-zod-compatibility-hook.cjs");
const {
	kanelDatabaseDefaultExportFixPreRenderHook,
} = require("./src/kanel/kanel-database-default-export-fix-hook.cjs");
const { cleanupEnumComments } = require("./src/kanel/kanel-cleanup-enum-comments.cjs");
const { escapeIdentifier } = require("kanel");
const { resolveType } = require("kanel");
const { escapeString } = require("kanel");
const { recase } = require("@kristiandupont/recase");

const toPascalCase = recase(null, "pascal");

/** @type {import('kanel').Config} */
module.exports = {
	connection: process.env["DATABASE_URL"],
	schemas: ["public"],

	preDeleteOutputFolder: false,
	enumStyle: "enum",
	generateIdentifierType: (column, details, config) => {
		const name = escapeIdentifier(toPascalCase(details.name) + toPascalCase(column.name));
		const innerType = resolveType(column, details, {
			...config,
			// Explicitly disable identifier resolution so we get the actual inner type here
			generateIdentifierType: undefined,
		});
		const imports = [];

		let type = innerType;
		if (typeof innerType === "object") {
			// Handle non-primitives
			type = innerType.name;
			imports.push(...innerType.typeImports);
		}

		return {
			declarationType: "typeDeclaration",
			name,
			exportAs: "named",
			typeDefinition: [`${type} & { __brand: '${escapeString(name)}' }`],
			typeImports: imports,
			comment: [`Identifier type for ${details.schemaName}.${details.name}`],
		};
	},
	preRenderHooks: [
		makeKyselyHook(),
		generateZodSchemas,
		kanelKyselyZodCompatibilityPreRenderHook,
		kanelDatabaseDefaultExportFixPreRenderHook,
		cleanupEnumComments,
	],
	outputPath: "./src",

	customTypeMap: {
		"pg_catalog.tsvector": "string",
		"pg_catalog.bpchar": "string",
	},
};
