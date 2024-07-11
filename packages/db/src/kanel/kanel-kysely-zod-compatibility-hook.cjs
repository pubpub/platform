// @ts-check

const kanelZodCastRegex = /as unknown as z.Schema<(.*?)(Mutator|Initializer)?>/;

/**
 * @param {string} schemaName
 */
const asZodObject = (schemaName) =>
	`as z.ZodObject<{[K in keyof ${schemaName}]: z.Schema<${schemaName}[K]>}>`;

const replaceSchemaCast = (/** @type {string} */ line) => {
	line = line.replace(/(\w+?: [^z][^.]\w+)/, "$1Schema");

	if (!line.includes("as unknown as z.Schema")) {
		return line;
	}

	const replacedLine = line.replace(kanelZodCastRegex, (_, typeName, mutatorOrInitializer) => {
		// TODO: write custom maps for unknown types, that way i don't need to do this
		return "";
		if (!mutatorOrInitializer) {
			return asZodObject(typeName);
		}

		if (mutatorOrInitializer === "Mutator") {
			return asZodObject(`${typeName}Update`);
		}

		return asZodObject(`New${typeName}`);
	});
	return replacedLine;
};

/**
 * @param {import("kanel").TypeImport} typeImport
 */
const renameImportToUseSchemaSuffix = (typeImport) => {
	const { importAsType, isDefault, name, isAbsolute, path } = typeImport;
	const isSchemaImport = !isAbsolute && !isDefault && !importAsType;
	if (!isSchemaImport) {
		return typeImport;
	}

	return {
		...typeImport,
		name: `${name}Schema`,
	};
};

/**
 * even though they are not enforced to be uuids in the database
 * for backwards compatibility reasons, we still want to enforce them
 * to be uuids when parsing, as we use uuids everywhere
 * @param {string} line
 */
const makeUuid = (line) => line.replace(/z.string\(\) /, "z.string().uuid() ");

/**
 * @type {import("kanel").PreRenderHook}
 *
 * Renames the type of the `as unknown as z.Schema` casts from `kanel-zod` to
 * to be compatible with `kanel-kysely`, turning
 * 1. `as unknown as z.Schema<TableMutator>` into `as unknown as z.Schema<TableUpdate>`
 * 2. `as unknown as z.Schema<TableInitializer>` into `as unknown as z.Schema<NewTable>`
 */
function kanelKyselyZodCompatibilityPreRenderHook(outputAcc, instantiatedConfig) {
	const renamedSchemas = Object.fromEntries(
		Object.entries(outputAcc).map(([name, o]) => {
			const { declarations } = o;

			return [
				name,
				{
					declarations: declarations.map((declaration) => {
						if (declaration.declarationType !== "constant") {
							return declaration;
						}

						// change enum into native enum
						if (declaration.comment?.[0]?.startsWith("Zod schema for ")) {
							const enumName =
								declaration.comment?.[0].match(/Zod schema for (.*)/)?.[1];

							if (enumName) {
								declaration.value = [`z.nativeEnum(${enumName})`];
							}
						}

						/**
						 * rename all the imports to use the Schema suffix
						 */
						const imports = declaration.typeImports?.map(renameImportToUseSchemaSuffix);

						const declValue = Array.isArray(declaration.value)
							? declaration.value.map(replaceSchemaCast) // these are all the id schemas.
							: makeUuid(declaration.value);

						return {
							...declaration,
							typeImports: imports,
							value: declValue,
							name: `${declaration.name}Schema`,
						};
					}),
				},
			];
		})
	);

	return renamedSchemas;
}

module.exports = { kanelKyselyZodCompatibilityPreRenderHook };
